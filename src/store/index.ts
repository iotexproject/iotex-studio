import Vue from "vue";
import Vuex from "vuex";
import editor from "./editor";
import storage from "./storage";

import pathify, { make } from "vuex-pathify";
pathify.options.mapping = "simple";

import VuexPersist from "vuex-persist";
import { StorageStore } from "./storage";
import { EditorStore } from "./editor";

const storagePersist = new VuexPersist({
  key: "iotex-studio",
  storage: window.localStorage,
  modules: ["storage"],
});

const state = {};

const mutations = make.mutations(state);

Vue.use(Vuex);
export default new Vuex.Store<{
  editor: EditorStore;
  storage: StorageStore;
}>({
  plugins: [pathify.plugin, storagePersist.plugin],
  //@ts-ignore
  state,
  mutations,
  actions: {},
  modules: {
    editor,
    storage,
  },
});
