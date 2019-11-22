import Vue from "vue";
import Vuex from "vuex";
import editor from "./editor";

import pathify, { make } from "vuex-pathify";
pathify.options.mapping = "simple";

const state = {};

const mutations = make.mutations(state);

Vue.use(Vuex);
export default new Vuex.Store({
  plugins: [pathify.plugin],
  state,
  mutations,
  actions: {},
  modules: {
    editor
  }
});
