<template>
  <div>
    <app-header :username="identity?.name" :token="identity?.token" :avatar-url="identity?.avatar_url" @changed="tokenChanged" />
    <div class="separator"></div>
    <tickets :user="identity.name" :token="identity?.token" v-if="identity" />
  </div>
</template>

<script>
import appHeader from '@/components/AppHeader.vue';
import tickets from '@/components/Tickets.vue';
import store from 'store';
import {ghapi} from '@/githubapi';

export default {
  name: 'App',
  data() {
    return {
      identity: null
    };
  },
  components: {
    appHeader,
    tickets
  },
  mounted() {
    const token = store.get('token');
    ghapi.setIdentity(token).then(identity => this.identity = identity);
  },
  methods: {
    tokenChanged(newToken) {
      store.set('token', newToken);
      ghapi.setIdentity(newToken).then(identity => this.identity = identity);
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.separator {
  display: block;
  height: 1em;
  clear: both;
}
</style>
