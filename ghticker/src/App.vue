<template>
  <div>
    <app-header :username="identity?.name" :token="identity?.token" :avatar-url="identity?.avatar_url" @changed="tokenChanged" @settings="showSettings=true" v-if="appLoaded" />
    <div class="separator"></div>
    <app-tickets :user="identity.name" :token="identity?.token" :backendUrl="backendUrl" v-if="identity" />
    <app-settings :backendUrl="backendUrl" @cancel="showSettings=false" @ok="saveSettings" v-if="appLoaded && showSettings" />
  </div>
</template>

<script>
import appHeader from '@/components/AppHeader.vue';
import appTickets from '@/components/Tickets.vue';
import appSettings from '@/components/Settings.vue';
import store from 'store';
import {ghapi} from '@/githubapi';

export default {
  name: 'App',
  data() {
    //store.set('backendUrl', 'http://localhost:3000/');
    let backendUrl = store.get('backendUrl');
    if (!backendUrl.match(/\/$/))
      backendUrl += '/';

    return {
      identity: null,
      backendUrl: backendUrl,
      appLoaded: false,
      showSettings: false
    };
  },
  components: {
    appHeader,
    appTickets,
    appSettings
  },
  mounted() {
    const token = store.get('token');
    ghapi.setIdentity(token).then(identity => this.identity = identity);
    this.appLoaded = true;
  },
  methods: {
    tokenChanged(newToken) {
      store.set('token', newToken);
      ghapi.setIdentity(newToken).then(identity => this.identity = identity);
    },
    saveSettings(settings) {
      this.showSettings = false;

      if (!settings.url)
        return;
      else if (!settings.url.match(/\/$/))
        settings.url += '/';

      store.set('backendUrl', settings.url);
      this.backendUrl = settings.url;
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
