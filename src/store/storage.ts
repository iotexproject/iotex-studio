import { make } from "vuex-pathify";
import { EditorStore, StorageStore } from "./type";

const state: StorageStore = {
  split: {
    size: {
      main: [10, 70, 20],
      editor: [75, 25]
    }
  },
  fileManager: {
    curFilePath: null
  },
  toolbar: {
    tabs: {}
  }
};

const mutations = make.mutations(state);

export default {
  namespaced: true,
  mutations,
  state
};
