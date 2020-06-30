import { make } from "vuex-pathify";
import { FS } from "../utils/fs";

const state: {
  solc: {
    version: string;
  };
  split: {
    size: {
      main: number[];
      editor: number[];
    };
  };
  fileManager: {
    curFilePath: string;
    curLinkStatus: "init" | "connecting" | "failed" | "connected";
  };
  toolbar: {
    tabs: {
      [key: string]: Partial<FS["file"]>;
    };
  };
} = {
  solc: {
    version: "v0.5.0-stable-2018.11.13",
  },
  split: {
    size: {
      main: [10, 70, 20],
      editor: [75, 25],
    },
  },
  fileManager: {
    curFilePath: null,
    curLinkStatus: "init",
  },
  toolbar: {
    tabs: {},
  },
};

export type StorageStore = typeof state;

const mutations = make.mutations(state);

export default {
  namespaced: true,
  mutations,
  state,
};
