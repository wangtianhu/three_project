import Vue from 'vue'
import App from './App.vue'
import '@/assets/css/common.css'
Vue.config.productionTip = false
import * as Three from 'three'
Vue.prototype.$THREE = Three
new Vue({
  render: (h) => h(App),
}).$mount('#app')
