import { make } from "vuex-pathify";
import * as constant from "../utils/constant";
import store from "@/store";
import { FS } from "../utils/fs";
import ace from "brace";
import { CompiledContract } from "./type";
import { _ } from "../utils/lodash";
import semver from "semver";

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
      builds: { build: string; keccak256: string; longVersion: string; path: string; urls: string[] }[];
      latestRelease: string;
      releases: { [key: string]: string };
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
      { path: "/project/default/erc20/erc20.sol", content: constant.erc20, ensure: true },
      { path: "/project/default/erc721/erc721.sol", content: constant.erc721, ensure: true },
    ],
  },

  solc: {
    loading: false,
    compileLoading: false,
    compiler: null,
    currentContractName: "",
    compileResult: {},
    versions: {
      builds: [],
      latestRelease: "",
      releases: {},
    },
  },
};

export type EditorStore = typeof state;

const getters: {
  [key: string]: (state: EditorStore) => any;
} = {
  curFile: (state) => store.state.editor.fileManager.files[store.state.storage.curProject.fileManager.curFilePath],
  versions: (state) => {
    const versions = {};
    _.each(state.solc.versions.releases, (v, k) => {
      if (semver.satisfies(k, "0.1.1 - 0.5.13")) {
        versions[k] = v;
      }
    });
    return versions;
  },
};
const mutations = make.mutations(state);

export default {
  namespaced: true,
  getters,
  mutations,
  state,
};
