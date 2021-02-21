module.exports = {
    controllers: {
        ticket: function (db) {
            this.db = db;

            return {
                hours: function (req, res, data) {
                    this.db.findHours(data.repo, data.tickets, function (err, docs) {
                        let result = {
                            repo: data.repo,
                            error: err,
                            hours: docs ? docs.map(x => { return { id: x.ticket, estimate: x.estimate || 0, materialized: x.materialized || 0 }; }) : []
                        };

                        res.end(JSON.stringify(result));
                    });
                },
                sethours: function (req, res, data) {
                    this.db.storeHours(data.repo, data.ticket, data.estimate, data.materialized, function (err) {
                        let result = {
                            repo: data.repo,
                            id: data.ticket,
                            estimate: data.estimate,
                            materialized: data.materialized,
                            error: err
                        };

                        res.end(JSON.stringify(result));
                    });
                }
            };
        },
        user: function (db) {
            this.db = db;

            return {
                availabilities: function (req, res, data) {
                    this.db.findAvailabilities(data.repo, data.milestone, data.users, function (err, docs) {
                        let result = {
                            availabilities: docs ? docs.map(x => { return { id: x.user, availability: x.availability }; }) : [],
                            repo: data.repo,
                            milestone: data.milestone,
                            error: err
                        };

                        res.end(JSON.stringify(result));
                    });
                },
                availability: function (req, res, data) {
                    if (data.availability == undefined)
                        data.availability = -1;

                    this.db.storeAvailabilities(data.repo, data.milestone, data.user, data.availability, function (err) {
                        let result = {
                            id: data.user,
                            repo: data.repo,
                            milestone: data.milestone,
                            availability: data.availability < 0 ? null : data.availability,
                            error: err
                        };

                        res.end(JSON.stringify(result));
                    });
                }
            };
        },
        data: function (db) {
            this.db = db;

            return {
                bulkInsert: function (req, res, data) {
                    const issues = data.estimates.filter(x => x.ticket).map(x => { return { repo: data.repo, ticket: x.ticket, estimate: x.estimate, materialized: 0 }; });

                    let removables = [],
                        insertables = [],
                        updatables = [];

                    this.db.getHours(data.repo)
                        .then(existingTickets => {
                            // Find those tickets that exist in database but are not in POST data
                            // We need to get user confirmation to actually delete these
                            existingTickets.forEach(existingTicket => {
                                if (!issues.find(x => x.ticket === existingTicket.ticket))
                                    removables.push(existingTicket);
                            });

                            // Find tickets to be removed or updated
                            issues.forEach(issue => {
                                const existingTicket = existingTickets.find(x => x.ticket === issue.ticket);
                                if (!existingTicket)
                                    insertables.push(issue);
                                else if (existingTicket.estimate !== issue.estimate) {
                                    issue.materialized = existingTickets.materialized;
                                    updatables.push(issue);
                                }
                            });

                            // Then run database queries
                            this.db.insertHours(insertables)
                                .then(numInserted => {
                                    this.db.updateHours(updatables)
                                        .then(numUpdated => {
                                            res.end(JSON.stringify({
                                                removables: removables,
                                                inserted: numInserted,
                                                updated: numUpdated
                                            }));
                                        })
                                        .catch(error => res.end(JSON.stringify({ error: error })));;
                                })
                                .catch(error => res.end(JSON.stringify({ error: error })));;
                        })
                        .catch(error => res.end(JSON.stringify({ error: error })));
                },
                bulkRemove: function (req, res, data) {
                    this.db.removeHours(data.tickets)
                        .then(numRemoved => res.end(JSON.stringify({ removed: numRemoved })))
                        .catch(error => res.end(JSON.stringify({ error: error })));
                }
            };
        }
    }
};