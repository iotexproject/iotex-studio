<template lang="pug">
  .app.flex.justify-center.px-10
    file-manager.file-manager.border-r
    .editor.flex-1.flex.flex-col.p
      toolbar.toolbar.border-b
      editor.flex-auto(ref="editor" height='100%' width='100%')
      terminal.border-t(height="300px" width="100%")
    .plugin.px-2.border-l
      compiler
      el-divider
      deployer

</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class Home extends Vue {}
</script>

<style lang="stylus" scoped>
@import '../assets/global.styl'

.app
  height 100vh
  padding-top 40px
  .file-manager
    width 10vw
    overflow auto
    border-color color-dark-border
  .toolbar
    border-color color-dark-border
    z-index 10
  .terminal
    border-color color-dark-border
  .editor
    width 70vw
  .plugin
    border-color color-dark-border
    width 20vw
    overflow auto
</style>
