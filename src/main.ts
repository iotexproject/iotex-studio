import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./components";
import "./utils/filter";
import "./utils/directives";
import { _ } from "./utils/lodash";

import "./plugins/element-ui";

import VueClipboard from "vue-clipboard2";
Vue.use(VueClipboard);

import contentmenu from "v-contextmenu";
Vue.use(contentmenu);

import VueSplit from "vue-split-panel";
import { eventBus } from "./utils/eventBus";
Vue.use(VueSplit);

// Vue.config.errorHandler = (err, vm, info) => {
//   console.log({ err, vm, info });
//   // eventBus.emit("term.error", {
//   //   text: "err"
//   // });
// };

Vue.prototype.$_ = _;

Vue.config.productionTip = false;
new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
