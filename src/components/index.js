import Vue from "vue";

import Editor from "./Editor.vue";
import Compiler from "./Compiler.vue";
import Deployer from "./Deployer.vue";
import FileManager from "./FileManager.vue";

Vue.component("editor", Editor);
Vue.component("compiler", Compiler);
Vue.component("deployer", Deployer);
Vue.component("file-manager", FileManager);
