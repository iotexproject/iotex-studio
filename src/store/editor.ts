import { make } from "vuex-pathify";
import * as constant from "../utils/constant";
import store from "@/store";
import { FS } from "../utils/fs";
import ace from "brace";
import { CompiledContract } from "./type";

const state: {
  fileManager: {
    file?: FS["file"];
    files: {
      [key: string]: FS["file"];
    };
    filesLoaded: FS["files"];
    defaultFiles: { path: string; content: string; ensure: boolean }[];
  };
  ace: {
    editor: ace.Editor;
  };
  solc: {
    loading: boolean;
    compileLoading: boolean;
    compiler: any;
    compileResult: Record<string, CompiledContract>;
    currentContractName: string;
    versions: {
      all: string[];
      nightly: string[];
      releases: string[];
    };
  };
} = {
  ace: {
    editor: null,
  },
  fileManager: {
    files: {},
    filesLoaded: [],
    defaultFiles: [
      { path: "/project/default/test.sol", content: constant.defaultContract, ensure: true },
      // { path: "/project/default/erc20/erc20.sol", content: constant.erc20, ensure: true }
    ],
  },

  solc: {
    loading: false,
    compileLoading: false,
    compiler: null,
    currentContractName: "",
    compileResult: {},
    versions: {
      all: [],
      nightly: [],
      releases: [],
    },
  },
};

export type EditorStore = typeof state;

const getters: {
  [key: string]: (state: EditorStore) => any;
} = {
  curFile: (state) => store.state.editor.fileManager.files[store.state.storage.curProject.fileManager.curFilePath],
};
const mutations = make.mutations(state);

export default {
  namespaced: true,
  getters,
  mutations,
  state,
};
