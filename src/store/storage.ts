import { make } from "vuex-pathify";
import { FS } from "../utils/fs";
import { CompiledContract } from "./type";

const state: {
  curProject: {
    solc: {
      version: string;
    };
    fileManager: {
      curDir: string;
      curFilePath: string;
      curLinkStatus: "init" | "connecting" | "failed" | "connected";
    };
    toolbar: {
      tabs: {
        [key: string]: Partial<FS["file"]>;
      };
    };
  };
  ace: {
    content: string;
    theme: string;
    lang: string;
    options: any;
  };

  split: {
    size: {
      main: number[];
      editor: number[];
    };
  };
} = {
  ace: {
    content: "",
    theme: "tomorrow_night_eighties",
    lang: "solidity",
    options: {
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      // enableSnippets: true
    },
  },
  split: {
    size: {
      main: [10, 70, 20],
      editor: [75, 25],
    },
  },
  curProject: {
    solc: {
      version: "soljson-v0.5.5+commit.47a71e8f.js",
    },
    fileManager: {
      curDir: "/project/default",
      curFilePath: null,
      curLinkStatus: "init",
    },
    toolbar: {
      tabs: {},
    },
  },
};

export type StorageStore = typeof state;

const mutations = make.mutations(state);

export default {
  namespaced: true,
  mutations,
  state,
};
