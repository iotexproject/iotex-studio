import { make } from "vuex-pathify";
import { defaultContract, defaultContract1 } from "../utils/constant";
import { EditorStore } from "./type";

const state: EditorStore = {
  fileManager: {
    curDir: "/project",
    curFilePath: null,
    files: [],
    defaultFiles: [
      { path: "/project/test.sol", content: defaultContract, ensure: true },
      { path: "/project/test1.sol", content: defaultContract1, ensure: true }
    ]
  },
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

const getters = {
  curFile: state => state.fileManager.files.find(i => i.path == state.fileManager.curFilePath),
  curFileIndex: state => state.fileManager.files.findIndex(i => i.path == state.fileManager.curFilePath)
};
const mutations = make.mutations(state);

export default {
  namespaced: true,
  getters,
  mutations,
  state
};
