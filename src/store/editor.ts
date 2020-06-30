import { make } from "vuex-pathify";
import * as constant from "../utils/constant";
import store from "@/store";
import { FS } from "../utils/fs";
import ace from "brace";
import { CompiledContract } from "./type";

const state: {
  fileManager: {
    curDir: string;
    file?: FS["file"];
    files: {
      [key: string]: FS["file"];
    };
    filesLoaded: FS["files"];
    defaultFiles: { path: string; content: string; ensure: boolean }[];
  };
  ace: {
    content: string;
    editor: ace.Editor;
    theme: string;
    lang: string;
    options: any;
  };
  solc: {
    loading: boolean;
    compileLoading: boolean;
    compiler: any;
    versions: {
      all: string[];
      nightly: string[];
      releases: string[];
    };
    compileResult: Record<string, CompiledContract>;
  };
} = {
  fileManager: {
    curDir: "/project/default",
    files: {},
    filesLoaded: [],
    defaultFiles: [
      { path: "/project/default/test.sol", content: constant.defaultContract, ensure: true },
      // { path: "/project/default/erc20/erc20.sol", content: constant.erc20, ensure: true }
    ],
  },
  ace: {
    content: "",
    editor: null,
    theme: "tomorrow_night_eighties",
    lang: "solidity",
    options: {
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      // enableSnippets: true
    },
  },
  solc: {
    loading: false,
    compileLoading: false,
    compiler: null,
    versions: {
      all: [],
      nightly: [],
      releases: [],
    },
    compileResult: {},
  },
};

export type EditorStore = typeof state;

const getters: {
  [key: string]: (state: EditorStore) => any;
} = {
  curFile: (state) => store.state.editor.fileManager.files[store.state.storage.fileManager.curFilePath],
};
const mutations = make.mutations(state);

export default {
  namespaced: true,
  getters,
  mutations,
  state,
};
