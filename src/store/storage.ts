import { make } from "vuex-pathify";
import { FS } from "../utils/fs";

const state: {
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
