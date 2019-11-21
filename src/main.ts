import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./components";
import "browser-solc";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import { _ } from "./utils/lodash";
import VueClipboard from "vue-clipboard2";

Vue.use(VueClipboard);
Vue.use(ElementUI);

Vue.config.productionTip = false;

Vue.prototype.$_ = _;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
