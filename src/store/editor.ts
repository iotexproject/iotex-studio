import { make } from "vuex-pathify";
import { defaultContract } from "../utils/constant";
import { EditorStore } from "./type";

const state: EditorStore = {
  ace: {
    content: localStorage.getItem("content") || defaultContract,
    editor: null,
    theme: "chrome",
    lang: "solidity",
    options: {
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true
      // enableSnippets: true
    }
  },
  solc: {
    version: "v0.5.0-stable-2018.11.13",
    loading: false,
    compileLoading: false,
    compiler: null,
    versions: {
      all: [],
      nightly: [],
      releases: []
    },
    compileResult: {},
    currentContract: null
  }
};

const mutations = make.mutations(state);

export default {
  namespaced: true,
  mutations,
  state
};
