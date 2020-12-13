<template>
    <div>
        <ul class="nav nav-tabs nav-justified">
            <li v-for="repo in repos" :key="repo.id">
                <a data-toggle="tab" :href="'#repo-' + repo.id" @click="selectRepo(repo)">{{repo.name}}</a>
            </li>
        </ul>

        <div class="tab-content">
            <div v-for="repo in repos" :key="repo.id" :id="'repo-' + repo.id" class="tab-pane fade">
                {{repo.name}}
                <table class="table">
                    <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>State</th>
                    </tr>
                    <tr v-for="issue in issues" :key="issue.id">
                        <td>{{issue.number}}</td>
                        <td>{{issue.title}}</td>
                        <td>Open</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import {ghapi} from '@/githubapi';

export default {
    name: 'tickets',
    props: {
        user: String,
        token: String
    },
    data() {
        return {
            repos: [],
            issues: []
        }
    },
    mounted() {
        ghapi.repos(this.user).then(data => this.repos = data);
    },
    methods: {
        selectRepo(repo) {
            ghapi.issues(this.user, repo.name).then(data => this.issues = data);
        }
    }
}
</script>

<style scoped>
    .nav-tabs li {
        padding: 3px;
    }
</style>