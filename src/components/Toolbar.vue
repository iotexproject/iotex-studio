<template lang="pug">
  .flex
    el-tabs(:value="curFilePath" type="card" closable @tab-remove="removeTab" @tab-click="clickTab")
      el-tab-pane(v-for="item in tabs" :key="item.path" :label="item.name" :name="item.path")
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { eventBus } from "../utils/eventBus";
import { _ } from "../utils/lodash";
import { debounce } from "helpful-decorators";
import { Sync } from "vuex-pathify";
import { FS } from "../utils/fs";
import { StorageStore } from "../store/storage";
import { EditorStore } from "../store/editor";

@Component
export default class Toolbar extends Vue {
  @Sync("storage/fileManager@curFilePath") curFilePath: string;
  @Sync("editor/fileManager@files") files: EditorStore["fileManager"]["files"];
  @Sync("storage/curProject@toolbar.tabs.data") tabs: StorageStore["curProject"]["toolbar"]["tabs"];

  name = "toolbar";

  removeTab(name) {
    this.$delete(this.tabs, name);
    if (!this.tabs[this.curFilePath]) {
      this.nextTab();
    }
  }

  nextTab() {
    const nextTab = this.tabs[Object.keys(this.tabs)[0]];
    nextTab && this.clickTab({ name: nextTab.path });
  }

  clickTab({ name: path }) {
    eventBus.emit("toolbar.tab.select", this.tabs[path]);
  }

  created() {
    eventBus
      .on("fs.select", (file) => {
        const { path, name } = file;
        this.tabs = { ...this.tabs, [path]: { path, name } };
      })
      .on("fs.loadFiles", (files) => {
        if (!this.tabs) return;
        Object.keys(this.tabs).forEach((i) => {
          if (!files[i]) {
            this.$delete(this.tabs, i);
          }
          if (!files[this.curFilePath]) {
            this.nextTab();
          }
        });
      });
  }
}
</script>
