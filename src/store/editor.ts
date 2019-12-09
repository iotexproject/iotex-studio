import { make } from "vuex-pathify";
import * as constant from "../utils/constant";
import { EditorStore } from "./type";
import store from "@/store";

const state: EditorStore = {
  fileManager: {
    curDir: "/project/default",
    files: {},
    filesLoaded: [],
    defaultFiles: [
      { path: "/project/default/test.sol", content: constant.defaultContract, ensure: true },
      { path: "/project/default/erc20/erc20.sol", content: constant.erc20, ensure: true }
    ]
  },
  ace: {
    content: "",
    editor: null,
    theme: "tomorrow_night_eighties",
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
    compileResult: {}
  }
};

const getters: {
  [key: string]: (state: EditorStore) => any;
} = {
  curFile: state => store.state.editor.fileManager.files[store.state.storage.fileManager.curFilePath]
};
const mutations = make.mutations(state);

export default {
  namespaced: true,
  getters,
  mutations,
  state
};
