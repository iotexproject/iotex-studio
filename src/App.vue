<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class App extends Vue {}
</script>

<style lang="stylus">
@import './assets/tailwind.css'
@import '~v-contextmenu/dist/index.css'
@import "./assets/global.styl"
#app
  background color-dark
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  // text-align center
  color color-dark-text
div
  border-color color-dark-border
#app
  .ace_gutter
    color  color-dark-text
    background-color color-dark
    border-color color-dark-border
body
  .el-button--text
    color grey
  .el-form-item
    margin-bottom 0
  .el-form-item__label
    font-size 12px
  .el-tree-node__children
    .el-tree-node__content
      padding-left 8px !important
  .el-icon-caret-right
    display none
  .el-tree, .el-input_inner,   .el-input, .el-input__inner, .el-select-dropdown, .el-popper, .el-form-item__label
    color  color-dark-text
    background-color color-dark
    border-color color-dark-input-border
  .el-select-dropdown__item
    &.selected
      color lighten(color-dark-text, 20%)
    &.hover
      background-color darken(color-dark, 5)
  .el-divider
    background-color lighten(color-dark, 10)
  .el-button--primary, .el-button--default
    &:hover, &:focus
      color color-dark-text
      background lighten(color-dark, 10%)
      border-color lighten(color-dark-input-border, 10%)
    color color-dark-text
    background darken(color-dark, 20%)
    border-color color-dark-input-border
  .el-input__inner
    &:hover, &:focus
      color color-dark-text
      background lighten(color-dark, 10%)
      border-color lighten(color-dark-input-border, 10%)
    border-color color-dark-input-border
  .el-tree-node
    &:focus, &:hover
      > .el-tree-node__content
        background-color lighten(color-dark, 10%)
</style>
