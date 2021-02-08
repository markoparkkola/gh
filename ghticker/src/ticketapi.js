const axios = require('axios');

const ticketapi = {
    handleResolve: function(resolve, reject, data) {
        if (data.error)
            reject(data.error);
        else
            resolve(data);
    },    
    getHours(url, repositoryId, ticketIds) {
        return new Promise((resolve, reject) => {
            axios.post(url + 'ticket/hours', {repo: repositoryId, tickets: ticketIds})
            .then(response => this.handleResolve(resolve, reject, response.data))
            .catch(error => reject(error));
        });
    },
    setHours(url, repositoryId, ticketId, estimate, materialized) {
        return new Promise((resolve, reject) => {
            axios.post(url + 'ticket/sethours', {repo: repositoryId, ticket: ticketId, estimate, materialized})
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
    },
    clear(url) {
        axios.post(url + 'data/clear', {run:true});
    }
};

export {ticketapi};