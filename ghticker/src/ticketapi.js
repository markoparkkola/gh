const axios = require('axios');

const ticketapi = {
    handleResolve: function(resolve, reject, data) {
        if (data.error)
            reject(data.error);
        else
            resolve(data);
    },    
    getEstimates(repositoryId, ticketIds) {
        return new Promise((resolve, reject) => {
            axios.post('http://localhost:3000/ticket/estimates', {repo: repositoryId, tickets: JSON.stringify(ticketIds)})
            .then(response => this.handleResolve(resolve, reject, response.data))
            .catch(error => reject(error));
        });
    },
    setEstimate(repositoryId, ticketId, estimate) {
        return new Promise((resolve, reject) => {
            axios.post('http://localhost:3000/ticket/estimate', {repo: repositoryId, ticket: ticketId, estimate})
            .then(response => this.handleResolve(resolve, reject, response.data))
            .catch(error => reject(error));
        });
    },
    getAvailabilities(userIds) {
        return new Promise((resolve, reject) => {
            axios.post('http://localhost:3000/user/availabilities', {users: JSON.stringify(userIds)})
            .then(response => this.handleResolve(resolve, reject, response.data))
            .catch(error => reject(error));
        });
    },
    setAvailability(userId, availability) {
        return new Promise((resolve, reject) => {
            axios.post('http://localhost:3000/user/availability', {user: userId, availability})
            .then(response => this.handleResolve(resolve, reject, response.data))
            .catch(error => reject(error));
        });
    }
};

export {ticketapi};