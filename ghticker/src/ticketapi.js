const axios = require('axios');

const ticketapi = {
    getEstimates(repositoryId, ticketIds) {
        return new Promise((resolve, reject) => {
            axios.post('http://localhost:3000/ticket/estimates', {repo: repositoryId, tickets: JSON.stringify(ticketIds)})
            .then(response => resolve(response.data))
            .catch(error => reject(error));
        });
    },
    setEstimate(repositoryId, ticketId, estimate) {
        return new Promise((resolve, reject) => {
            axios.post('http://localhost:3000/ticket/estimate', {repo: repositoryId, ticket: ticketId, estimate})
            .then(response => resolve(response.data))
            .catch(error => reject(error));
        });
    },
    getAvailabilities(userIds) {
        return new Promise((resolve, reject) => {
            axios.post('http://localhost:3000/user/availabilities', {users: JSON.stringify(userIds)})
            .then(response => resolve(response.data))
            .catch(error => reject(error));
        });
    },
    setAvailability(userId, availability) {
        return new Promise((resolve, reject) => {
            axios.post('http://localhost:3000/user/availability', {user: userId, availability})
            .then(response => resolve(response.data))
            .catch(error => reject(error));
        });
    }
};

export {ticketapi};