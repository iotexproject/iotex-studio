import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./components";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import { _ } from "./utils/lodash";
import VueClipboard from "vue-clipboard2";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);

Vue.use(VueClipboard);
Vue.use(ElementUI);

Vue.prototype.$_ = _;

Vue.config.productionTip = false;
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
