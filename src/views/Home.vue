<template lang="pug">
  .app.flex.justify-center.px-10
    file-manager.file-manager
    .editor.flex-1.px-4
      editor.flex-auto(ref="editor" height='100%' width='100%')
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
  .file-manager
    width 10vw
    height 100vh
    overflow auto
  .editor
    width 70vw
    height 100vh
  .plugin
    width 20vw
    height 100vh
    overflow auto
</style>