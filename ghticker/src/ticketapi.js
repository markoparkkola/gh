const axios = require('axios');

const ticketapi = {
    handleResolve: function(resolve, reject, data) {
        if (data.error)
            reject(data.error);
        else
            resolve(data);
    },    
    getEstimates(url, repositoryId, ticketIds) {
        return new Promise((resolve, reject) => {
            axios.post(url + 'ticket/estimates', {repo: repositoryId, tickets: ticketIds})
            .then(response => this.handleResolve(resolve, reject, response.data))
            .catch(error => reject(error));
        });
    },
    setEstimate(url, repositoryId, ticketId, estimate) {
        return new Promise((resolve, reject) => {
            axios.post(url + 'ticket/estimate', {repo: repositoryId, ticket: ticketId, estimate})
            .then(response => this.handleResolve(resolve, reject, response.data))
            .catch(error => reject(error));
        });
    },
    getAvailabilities(url, repositoryId, milestoneId, userIds) {
        return new Promise((resolve, reject) => {
            axios.post(url + 'user/availabilities', {repo: repositoryId, milestone: milestoneId, users: userIds})
            .then(response => this.handleResolve(resolve, reject, response.data))
            .catch(error => reject(error));
        });
    },
    setAvailability(url, repositoryId, milestoneId, userId, availability) {
        return new Promise((resolve, reject) => {
            axios.post(url + 'user/availability', {repo: repositoryId, milestone: milestoneId, user: userId, availability})
            .then(response => this.handleResolve(resolve, reject, response.data))
            .catch(error => reject(error));
        });
    },
    bulkInsert(url, repositoryId, estimates) {
        return new Promise((resolve, reject) => {
            axios.post(url + 'data/bulkInsert', {repo: repositoryId, estimates: estimates})
            .then(response => this.handleResolve(resolve, reject, response.data))
            .catch(error => reject(error));
        });
    }
};

export {ticketapi};