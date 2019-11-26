<template lang="pug">
  .app.flex.justify-center.px-10
    file-manager.file-manager
    .editor.flex-1.px-4.flex.flex-col.p
      editor.flex-auto(ref="editor" height='100%' width='100%')
      terminal(height="300px" width="100%")
    .plugin
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
.app
  height 100vh
  padding-top 40px
  .file-manager
    width 10vw
    overflow auto
  .editor
    width 70vw
  .plugin
    width 20vw
    overflow auto
</style>
