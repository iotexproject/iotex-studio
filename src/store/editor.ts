import { make } from "vuex-pathify";
import * as constant from "../utils/constant";
import { EditorStore } from "./type";

const state: EditorStore = {
  fileManager: {
    curDir: "/project/default",
    curFilePath: null,
    files: {},
    defaultFiles: [
      { path: "/project/default/test.sol", content: constant.defaultContract, ensure: true },
      { path: "/project/default/erc20.sol", content: constant.erc20, ensure: true }
    ]
  },
  ace: {
    content: "",
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

const getters = {
  curFile: state => state.fileManager.files[state.fileManager.curFilePath]
};
const mutations = make.mutations(state);

export default {
  namespaced: true,
  getters,
  mutations,
  state
};
