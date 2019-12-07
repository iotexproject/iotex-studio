<template lang="pug">
  .flex
    el-tabs(:value="curFilePath" type="card" closable @tab-remove="removeTab" @tab-click="clickTab")
      el-tab-pane(v-for="item in config.tabs" :key="item.path" :label="item.name" :name="item.path")
</template>


<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { eventBus } from "../utils/eventBus";
import { _ } from "../utils/lodash";
import { FuncBus } from "../utils/funcBus";
import { debounce } from "helpful-decorators";
import { EditorStore } from "../store/type";
import { Sync } from "vuex-pathify";
import { FS } from "../utils/fs";

@Component
export default class Toolbar extends Vue {
  @Sync("editor/fileManager@curFilePath") curFilePath: string;
  name = "toolbar";
  config: {
    tabs: {
      [key: string]: Partial<FS["file"]>;
    };
  } = FuncBus.getConfig(this.name) || {
    tabs: {}
  };

  @debounce(100)
  saveConfig() {
    FuncBus.setConfig(this.name, this.config);
  }

  removeTab(name) {
    this.$delete(this.config.tabs, name);
    this.saveConfig();
    const nextTab = this.config.tabs[Object.keys(this.config.tabs)[0]];
    this.clickTab({ name: nextTab.path });
  }

  clickTab({ name: path }) {
    eventBus.emit("toolbar.tab.select", this.config.tabs[path]);
  }

  created() {
    eventBus
      .on("fs.select", file => {
        const { path, name } = file;
        this.config.tabs = { ...this.config.tabs, [path]: { path, name } };
        this.saveConfig();
      })
      .on("fs.loadFiles", files => {
        console.log(files);
        Object.keys(this.config.tabs).forEach(i => {
          if (!files[i]) {
            this.$delete(this.config.tabs, i);
          }
        });
      });
  }
}
</script>