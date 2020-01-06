import Vue from "vue";

import Editor from "./Editor.vue";
import Compiler from "./Compiler.vue";
import Deployer from "./Deployer.vue";
import FileManager from "./FileManager.vue";
import Terminal from "./Terminal.vue";
import Toolbar from "./Toolbar.vue";
import Menubar from "./Menubar.vue";
import StatusBar from "./Statusbar.vue";

Vue.component("editor", Editor);
Vue.component("compiler", Compiler);
Vue.component("deployer", Deployer);
Vue.component("file-manager", FileManager);
Vue.component("terminal", Terminal);
Vue.component("toolbar", Toolbar);
Vue.component("menubar", Menubar);
Vue.component("statusbar", StatusBar);
