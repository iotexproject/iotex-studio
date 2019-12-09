<template lang="pug">
  .menubar
    .flex.px-4.items-center
      span Iotex Studio
      el-menu(mode="horizontal")
        el-submenu(index="1" show-timeout="0" hide-timeout="0")
          span(slot="title") File
          el-menu-item(@click="newFile") New File
          el-menu-item(@click="newFolder") New Folder
          el-menu-item(@click="newFolder") Save All
        el-submenu(index="2" show-timeout="0" hide-timeout="0")
          span(slot="title") Edit
          el-menu-item(@click="undo") Undo
          el-menu-item(@click="redo") Redo



</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { eventBus } from "../utils/eventBus";

@Component
export default class Menubar extends Vue {
  newFile() {
    eventBus.emit("menubar.newFile");
  }
  newFolder() {
    eventBus.emit("menubar.newFolder");
  }
  undo() {
    eventBus.emit("menubar.undo");
  }
  redo() {
    eventBus.emit("menubar.redo");
  }
}
</script>

<style lang="stylus">
@import '../assets/global.styl'

body
  .menubar
    height 24px
    color white
    font-weight 500
    font-size 14px
  .el-menu--horizontal
    margin-left 10px
    background transparent
    border none !important
    height 24px
    line-height 24px
    .el-menu--popup-bottom-start
      margin-top 0px
    .el-submenu__icon-arrow
      display none
    .el-submenu .el-submenu__title, .el-menu .el-menu-item
        height 24px
        line-height 24px
        background  transparent
        border none
        color white
        &:hover
          color white
          background mix(color-dark, color-primary)
    .el-submenu
      &:focus
        .el-submenu__title
          color white
    .el-menu
      border-bottom-right-radius .25rem
      border-bottom-left-radius .25rem
      background lighten(color-dark, 5%)
      .el-menu-item
        background lighten(color-dark, 5%)
</style>
