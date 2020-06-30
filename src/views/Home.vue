<template lang="pug">
  .app.flex.flex-col
    menubar.menubar.border-b
    Split.content.flex-1.flex.mt-1(@onDragEnd="size => setSplitSize('main', size)")
      SplitArea(:size.sync="splitSize.main[0]")
        file-manager.file-manager.border-r.h-full
      SplitArea.flex.flex-col.w-full(:size.sync="splitSize.main[1]")
        Split.flex.flex-col.w-full.flex-1(direction="vertical" @onDragEnd="size => setSplitSize('editor', size)")
          toolbar.toolbar.border-b
          SplitArea(:size="splitSize.editor[0]")
            editor.w-full.flex-1(ref="editor")
          SplitArea(:size="splitSize.editor[1]")
            terminal.border-t
      SplitArea.plugin.px-2.border-l.py-2(:size="splitSize.main[2]")
        compiler
        el-divider.mt-4.mb-2
        deployer

</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Sync } from "vuex-pathify";
import { debounce } from "helpful-decorators";
import { StorageStore } from "../store/storage";

@Component
export default class Home extends Vue {
  @Sync("storage/split@size") splitSize: StorageStore["split"]["size"];

  @debounce(300)
  setSplitSize(key, size) {
    this.splitSize = {
      ...this.splitSize,
      [key]: size,
    };
  }
}
</script>

<style lang="stylus" scoped>
@import '../assets/global.styl'

.app
  height 100vh
  .menubar
    background darken(color-dark, 15%)
  .content
    .file-manager
      overflow auto
      border-color color-dark-border
    .toolbar
      border-color color-dark-border
      z-index 10
    .terminal
      border-color color-dark-border
    .plugin
      border-color color-dark-border
      overflow auto
</style>
