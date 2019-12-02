import Vue from "vue";
import Vuex from "vuex";
import editor from "./editor";

import pathify, { make } from "vuex-pathify";
import { EditorStore } from "./type";
pathify.options.mapping = "simple";

const state = {};

const mutations = make.mutations(state);

Vue.use(Vuex);
export default new Vuex.Store<{
  editor: EditorStore;
}>({
  plugins: [pathify.plugin],
  //@ts-ignore
  state,
  mutations,
  actions: {},
  modules: {
    editor
  }
});
