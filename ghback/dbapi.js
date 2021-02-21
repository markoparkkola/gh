let Datastore = require('nedb');

module.exports = {
    databaseService: function () {
        const self = this;
        this.ticketDb = new Datastore({ filename: 'tickets.db', autoload: true });
        this.ticketDb.ensureIndex({ fieldName: 'ticket', unique: true });

        this.userDb = new Datastore({ filename: 'availabilities.db', autoload: true });
        this.userDb.ensureIndex({ fieldName: 'user', unique: true });

        this.assertNumber = function (value) {
            if (value == null || value == undefined || typeof value === 'number')
                return value;
            else
                return parseInt(value);
        };

        return {
            getHours: function (repo) {
                return new Promise((resolve, reject) => {
                    self.ticketDb.find({ repo: repo }, (err, docs) => {
                        if (err)
                            reject(err);
                        else
                            resolve(docs);
                    });
                });
            },

            insertHours: function (tickets) {
                return new Promise((resolve, reject) => {
                    self.ticketDb.insert(tickets, (err, num) => {
                        if (err)
                            reject(err);
                        else
                            resolve(num);
                    });
                });
            },

            updateHours: function (tickets) {
                return new Promise((resolve, reject) => {
                    self.ticketDb.update(tickets, (err, num) => {
                        if (err)
                            reject(err);
                        else
                            resolve(num);
                    });
                });
            },

            storeHours: function (repo, ticket, estimate, materialized, callback) {
                self.ticketDb.findOne({ repo: repo, ticket: ticket }, function (err, doc) {
                    estimate = self.assertNumber(estimate);
                    materialized = self.assertNumber(materialized);
                    if (doc)
                        self.ticketDb.update({ repo: repo, ticket: ticket }, { $inc: { estimate: estimate, materialized: materialized } }, callback);
                    else
                        self.ticketDb.insert({ repo: repo, ticket: ticket, estimate: estimate, materialized: materialized }, callback);
                });
            },
            findHours: function (repo, tickets, callback) {
                if (typeof tickets === 'number')
                    self.ticketDb.findOne({ repo: repo, ticket: tickets }, callback);
                else
                    self.ticketDb.find({ repo: repo, ticket: { $in: tickets } }, callback);
            },
            storeAvailabilities: function (repo, milestone, user, availability, callback) {
                const query = { repo: repo, milestone: milestone, user: user };
                if (availability < 0)
                    self.userDb.remove({ repo: repo, milestone: milestone, user: user }, callback);
                else
                    self.userDb.findOne({ repo: repo, milestone: milestone, user: user }, function (err, doc) {
                        availability = self.assertNumber(availability);
                        if (doc)
                            self.userDb.update({ repo: repo, milestone: milestone, user: user }, { $inc: { availability: availability } }, callback);
                        else
                            self.userDb.insert({ repo: repo, milestone: milestone, user: user, availability: availability }, callback);
                    });
            },
            findAvailabilities: function (repo, milestone, users, callback) {
                if (!users || !users.length)
                    callback(null, []);
                else
                    self.userDb.find({ repo: repo, milestone: milestone, user: { $in: users } }, callback);
            }
        };
    }
};