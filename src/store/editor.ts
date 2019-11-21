import { make } from "vuex-pathify";
import { defaultContract } from "../utils/constant";

export interface EditorStore {
  content: string;
  solc: {
    version: string;
    loading: boolean;
    compiler: any;
    versions: {
      all: string[];
      nightly: string[];
      releases: string[];
    };
    compileResult: Record<string, any>;
    currentContract: any;
  };
}

const state: EditorStore = {
  content: localStorage.getItem("content") || defaultContract,
  solc: {
    version: "v0.5.0-stable-2018.11.13",
    loading: false,
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
