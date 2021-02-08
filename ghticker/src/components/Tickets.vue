<template>
    <div class="app-content">
        <select v-model="selectedRepository">
            <option v-for="repo in repos" :key="repo.id" :value="repo.id">{{repo.name}}</option>
        </select>

        <table class="table">
            <tr>
                <th># <span class="icon clickable" @click.stop="setSort('number')">{{getSortIcon('number')}}</span></th>
                <th>Title <span class="icon clickable" @click.stop="setSort('title')">{{getSortIcon('title')}}</span></th>
                <th>State <span class="icon clickable" @click.stop="setSort('state')">{{getSortIcon('state')}}</span></th>
                <th>
                    <select v-model="filters.milestone" @change="milestoneChanged">
                        <option value="">Milestones</option>
                        <option :value="ms.id" v-for="ms in milestones" :key="ms.id">{{ms.title}}</option>
                    </select>
                    <span class="icon clickable" @click.stop="setSort('milestone.id')">{{getSortIcon('milestone.id')}}</span>
                </th>
                <th>
                    <select v-model="filters.owner">
                        <option value="">Assignee(s)</option>
                        <option :value="u" v-for="u in users" :key="u">{{u}}</option>
                    </select>
                    <span class="icon clickable" @click.stop="setSort('assignees.login')">{{getSortIcon('assignees.login')}}</span>
                </th>
                <th>
                    Estimation
                    <span class="icon clickable" @click.stop="setSort('estimation')">{{getSortIcon('estimation')}}</span>
                </th>
            </tr>
            <tr v-for="issue in sortedIssues" :key="issue.id">
                <td><span>{{issue.number}}</span></td>
                <td><span :title="issue.title">{{issue.title}}</span> <span class="icon" title="Pull request" v-if="issue.pull_request">{{$root.icons.link}}</span></td>
                <td><span>{{issue.state}}</span></td>
                <td><span>{{issue.milestone?.title}}</span></td>
                <td>
                    <img :src="assignee.avatar_url" :title="assignee.login" class="avatar clickable" v-for="assignee in issue.assignees" :key="assignee.id" @click.stop="filters.owner=assignee.login" />
                </td>
                <td>
                    <div>
                        <input type="number" v-model="issue.estimation" @change="estimationChanged(issue)" />
                        <span class="clickable" @click.stop="estimationChanged(issue, 0)">{{$root.icons.crossHeavy}}</span>
                        <input type="number" v-model="issue.materialized" @change="materializedChanged(issue)" />
                        <span class="clickable" @click.stop="materializedChanged(issue, 0)">{{$root.icons.crossHeavy}}</span>
                    </div>
                    <div v-if="issue.estimation > 0">
                        <div class="percentage" :style="{background: 'linear-gradient(to right, green ' + issue.readyPercentage + '%, red 5%, red'}">
                            <span>{{issue.readyPercentage}}</span>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <table class="table">
            <tr>
                <th>Name</th>
                <th>Issue count</th>
                <th>Issue est.</th>
                <th>Available</th>
                <th>Fixed av.</th>
                <th>Workload</th>
            </tr>
            <tr v-for="user in realUsers" :key="user.id">
                <td><img :src="user.avatar_url" :title="user.login" class="avatar" /></td>
                <td>{{getUserIssues(user).count}}</td>
                <td>{{getUserIssues(user).estimation}}</td>
                <td>{{getUserAvailability(user)}}</td>
                <td>
                    <input type="number" :value="getFixedAvailability(user.id, selectedRepository, filters.milestone)" @change="availabilityChanged($event, user)" />
                    <span class="clickable" @click.stop="availabilityChanged($event, user, 0)">{{$root.icons.crossHeavy}}</span>
                </td>
                <td>
                    <div class="percentage green" :style="{background: 'linear-gradient(to right, red ' + (getUserIssues(user).estimation / getUserAvailability(user) * 100).toFixed(2) + '%, green 5%, green'}">
                        <span>{{(getUserIssues(user).estimation / getUserAvailability(user) * 100).toFixed(2)}}%</span>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
import {ghapi} from '@/githubapi';
import {ticketapi} from '@/ticketapi';

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

export default {
    name: 'app-tickets',
    props: {
        user: String,
        token: String,
        backendUrl: String
    },
    data() {
        return {
            selectedRepository: null,
            repos: [],
            issues: [],
            milestones: [],
            users: [],
            realUsers: [],
            availabilities: [],
            filters: {
                milestone: '',
                owner: ''
            },
            sorting: {
                property: 'number',
                direction: 'down'
            }
        }
    },
    mounted() {
        ghapi.repos(this.user)
            .then(data => this.repos = data);
    },
    methods: {
        parseAndSaveIssueEstimate() {
            const parseEstimate = function(str) {
                const m = str.match(/\(([0-9]+)(.+?)\)$/);
                if (!m)
                    return null;
                
                let value = parseFloat(m[1]);
                switch(m[2]) {
                    case 'h':
                    case 'hour':
                    case 'hours':
                        return value;
                    case 'd':
                    case 'day':
                    case 'days':
                        return value * 7.5;
                    default:
                        return null;
                }
            };

            const pushable = this.issues.map(x => { return { id: x.id, estimate: parseEstimate(x.title) }; }).filter(x => x.estimate != null);
            ticketapi.bulkInsert(this.backendUrl, this.selectedRepository, pushable);
        },
        selectRepo(repo) {
            this.users = [];
            this.realUsers = [];
            this.issues = [];
            this.filters.milestone = '';
            this.filters.owner = '';
            this.sorting.property = 'number';
            this.sorting.direction = 'down';

            ghapi.issues(repo.owner, repo.name).then(data => {
                this.issues = data.map(x => Object.assign({}, x, {estimation:0,materialized:0}));
                this.parseAndSaveIssueEstimate();

                this.users = [...new Set(data.filter(x => x.user).map(x => x.user.login))].sort();
                const self = this;
                
                const addUser = function(user) {
                    if (self.realUsers.filter(x => x.login === user.login).length > 0)
                        return;
                    self.realUsers.push(user);
                };

                data.filter(x => x.user || x.assignees.length).forEach(x => {
                    x.assignees.forEach(y => addUser(y));
                    addUser(x.user);
                });

                ticketapi.getAvailabilities(this.backendUrl, repo.id, null, this.realUsers.map(x => x.id))
                .then(userData => {
                    userData.availabilities.forEach(availability => {
                        self.setFixedAvailability(availability.id, userData.repo, userData.milestone, availability.availability);
                    });
                })
                .catch(error => console.log(error));

                ticketapi.getHours(this.backendUrl, repo.id, data.map(x => x.id))
                .then(ticketData => {
                    if (ticketData.repo === repo.id) {
                        ticketData.hours.forEach(h => {
                            let issue = this.issues.find(x => x.id === h.id);
                            if (issue) {
                                issue.estimation = h.estimate;
                                issue.materialized = h.materialized;
                                issue.readyPercentage = !h.estimate ? 0 : h.materialized / h.estimate * 100;
                            }
                        });
                    }
                })
                .catch(error => console.log(error));
            });
            ghapi.milestones(repo.owner, repo.name).then(data => this.milestones = data);
        },
        getSortIcon(property) {
            return property === this.sorting.property ?
                this.sorting.direction === 'down' ? this.$root.icons.arrowTriSmD : this.$root.icons.arrowTriSmU :
                this.$root.icons.circleBlackWhite;
        },
        setSort(property) {
            if (this.sorting.property === property)
                this.sorting.direction = this.sorting.direction === 'down' ? 'up' : 'down';
            else {
                this.sorting.property = property;
                this.sorting.direction = 'up';
            }
        },
        getUserIssues(user) {
            let userIssues = [];
            this.filteredIssues.forEach(x => {
                if (x.state === 'open' && x.assignees.find(y => y.login === user.login)) {
                    userIssues.push(parseFloat(x.estimation));
                }
            });
            
            return {
                count: userIssues.length,
                estimation: userIssues.reduce((a, b) => a + b, 0)
            };
        },
        getUserAvailability(user) {
            if (!user)
                return -1;
            const fixedAvailability = this.getFixedAvailability(user.id, this.selectedRepository, this.filters.milestone);
            if (fixedAvailability)
                return fixedAvailability;
            if (this.filters.milestone) {
                const milestone = this.milestones.find(x => x.id === this.filters.milestone);
                if (!milestone.due_on)
                    return 365 * 7.5;
                
                const startDate = new Date(milestone.title.substring(0, 4) + '-' + milestone.title.substring(4, 6) + '-' + milestone.title.substring(6, 8));
                const endDate = new Date(milestone.due_on).addDays(-1);
                let days = 0;

                for (let dt = startDate; dt < endDate; dt = dt.addDays(1)) {
                    let weekDay = dt.getDay();
                    if (weekDay !== 0 && weekDay !== 6)
                        days++;
                }

                return days * 7.5;
            }

            return 365 * 7.5;
        },
        estimationChanged(issue, value) {
            issue.estimation = value === undefined ? issue.estimation : value;
            ticketapi.setHours(this.backendUrl, this.selectedRepository, issue.id, issue.estimation, issue.materialized);
            issue.readyPercentage = !issue.estimation ? 0 : issue.materialized / issue.estimation * 100;
        },
        materializedChanged(issue, value) {
            issue.materialized = value === undefined ? issue.materialized : value;
            ticketapi.setHours(this.backendUrl, this.selectedRepository, issue.id, issue.estimation, issue.materialized);
            issue.readyPercentage = !issue.estimation ? 0 : issue.materialized / issue.estimation * 100;
        },
        availabilityChanged(event, user, value) {
            ticketapi.setAvailability(this.backendUrl, this.selectedRepository, this.filters.milestone, user.id, value || event.target.value)
            .then(x => { this.setFixedAvailability(user.id, this.selectedRepository, this.filters.milestone, x.availability); });
        },
        milestoneChanged() {
            const self = this;
            ticketapi.getAvailabilities(this.backendUrl, this.selectedRepository, this.filters.milestone, this.realUsers.map(x => x.id))
            .then(userData => {
                userData.availabilities.forEach(availability => {
                    self.setFixedAvailability(availability.id, userData.repo, userData.milestone, availability.availability);
                });
            })
            .catch(error => console.log(error));
        },
        setFixedAvailability(user, repo, milestone, availability) {
            let a = this.availabilities.find(x => x.user === user && x.repo === repo && x.milestone === milestone);
            if (a)
                a.availability = availability;
            else
                this.availabilities.push({user, repo, milestone, availability});
        },
        getFixedAvailability(user, repo, milestone) {
            const a =  this.availabilities.find(x => x.user === user && x.repo === repo && x.milestone === milestone);
            return a ? a.availability : null;
        },
        getReadyPercentage(issue) {
            if (issue.estimation === 0)
                return 'N/A';
            if (issue.materialized === 0)
                return '0%';
            return (issue.materialized / issue.estimation * 100).toString() + '%';
        },
        getReadyPercentageStyle(issue) {
            const percentage = parseFloat(this.getReadyPercentage(issue));
            return { background: `linear-gradient(to right, green ${percentage}, red: 20%, red` };
        }
    },
    watch: {
        selectedRepository: function(newRepo) {
            const selected = this.repos.filter(x => x.id === newRepo)[0];
            this.selectRepo(selected);
        }
    },
    computed: {
        filteredIssues: function() {
            const selectedFilters = [];
            function addFilter(predicate, method) {
                selectedFilters.push({
                    predicate,
                    method
                });
            }

            const milestoneFilter = function(issue) {
                return (!this && !issue.milestone) || (this === issue.milestone?.id);
            };

            const ownerFilter = function(issue) {
                return (!this && !issue.assignees.length) || (issue.assignees.filter(x => x.login === this).length > 0);
            }

            if (this.filters.milestone)
                addFilter(this.filters.milestone, milestoneFilter);
            if (this.filters.owner)
                addFilter(this.filters.owner, ownerFilter);

            let issues = this.issues;
            selectedFilters.forEach(x => issues = issues.filter(x.method, x.predicate));

            return issues;
        },
        sortedIssues: function() {
            const filtered = this.filteredIssues;
            const direction = this.sorting.direction === 'up' ? 1 : -1;

            const getPropertValue = function(o, name) {
                if (Array.isArray(o))
                    o = o.length > 0 ? o[0] : null;
                if (!o)
                    return null;
                if (name.includes('.'))
                    return getPropertValue(o[name.substring(0, name.indexOf('.'))], name.substring(name.indexOf('.') + 1));
                else
                    return o[name];
            };

            const sorted = filtered.sort((a, b) => {
                
                let va = getPropertValue(a, this.sorting.property),
                    vb = getPropertValue(b, this.sorting.property);

                return va === vb ? 
                    0 : 
                    (va < vb ? -1 : 1) * direction;
            });

            return sorted;
        }
    }
}
</script>

<style scoped>
    .app-content {
        margin-left: 15px;    
        margin-right: 15px;
        overflow: hidden;
    }

    .nav-tabs li {
        padding: 3px;
    }

    .table th, .table td {
        overflow: hidden;
        white-space: nowrap;
        position: relative;
        padding-right: 2rem;
    }

    .table td > span {
        display: inline-block;
        max-height: 3rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 25vh;
    }

    .table span.icon {
        position: absolute;
        right: 0;
        width: 2rem;
        text-align: right;
    }

    .avatar {
        max-width: 2rem;
        border-radius: 3px;
    }

    .clickable {
        cursor: pointer;
    }

    .clickable:hover {
        filter: brightness(115%);
    }

    .table [type=number] {
        max-width: 4rem;
    }

    .percentage {
        margin-top: 3px;
        border: 1px solid black;
        border-radius: 3px;
        padding: 3px;
        text-align: center;
        font-size: 60%;
        color: white;
        background-color: red;
    }

    .green {
        background-color: green;
    }
</style>