import { createApp } from 'vue'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import App from './App.vue'

let icons = require('glyphicons')
let theApp = createApp(App).mount('#app')
theApp.$data.icons = icons;