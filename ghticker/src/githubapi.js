const axios = require('axios');

const ghapi = {
    getToken() {
        return `token ${this.token}`;
    },
    setIdentity(token) {
        this.token = token;

        if (!token) {
            return new Promise(resolve => resolve(null));
        }

        return new Promise((resolve, reject) => {
            axios.get('https://api.github.com/user')
            .then(response => resolve({
                    name: response.data.login,
                    token: token,
                    avatar_url: response.data.avatar_url
                })
            )
            .catch(error => reject(error));
        });
    },
    repos() {
        return new Promise((resolve, reject) => {
            axios.get(`https://api.github.com/user/repos`)
            .then(response => resolve(response.data.map(x => { return { id: x.id, name: x.name, owner: x.owner.login }; })))
            .catch(error => reject(error));
        });
    },
    issues(owner, repo) {
        return new Promise((resolve, reject) => {
            axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`)
            .then(reponse => resolve(reponse.data))
            .catch(error => reject(error));
        });
    },
    labels(owner, repo) {
        return new Promise((resolve, reject) => {
            let labels = [];

            const fetchFn = function(page) {
                axios.get(`https://api.github.com/repos/${owner}/${repo}/labels?per_page=100&page=${page}`)
                .then(response => {
                    labels = labels.concat(response.data);
                    if (response.data.length === 100)
                        fetchFn(page + 1);
                    else
                        resolve(labels);
                })
                .catch(error => reject(error));
            };

            fetchFn(0);
        });
    },
    milestones(owner, repo) {
        return new Promise((resolve, reject) => {
            axios.get(`https://api.github.com/repos/${owner}/${repo}/milestones`)
            .then(reponse => resolve(reponse.data))
            .catch(error => reject(error));
        });
    }
};

axios.interceptors.request.use(function (config) {
    if (config.url.includes('https://api.github.com/')) {
        const token = ghapi.getToken();
        config.headers.Authorization = token;
        config.headers.Accept = 'application/vnd.github.v3+json';
    }
    return config;
});

export {ghapi};