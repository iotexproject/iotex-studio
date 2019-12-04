<template lang="pug">
  .terminal
    .content.bg-gray-900(:style="{height: height, width: width}")
      .flex.flex-col-reverse.h-full.overflow-auto
        .item(v-for="(item,index) in stdout" :key="index") 
          el-alert(v-if="item.component='alert'" :title="item.text" :type="item.type" show-icon :description="item.description" :closable="false")
          span(v-else) {{item.text}}
    .input-bar.flex.px-2.bg-gray-800.w-full.items-center
      span >
      el-input.input(v-model="input" @keyup.enter.native="runCommand")
    
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { Sync } from "vuex-pathify";
import { EditorStore, StdoutType } from "../store/type";
import { eventBus } from "../utils/eventBus";

@Component
export default class Term extends Vue {
  @Prop({ type: String }) height: string;
  @Prop({ type: String }) width: string;

  input = null;
  stdin = [];
  stdout = [];

  runCommand() {
    this.input = null;
  }

  writeLn(data: StdoutType) {
    this.stdout.unshift(data);
  }

  created() {
    eventBus
      .on("term.message", message => {
        this.writeLn(message);
      })
      .on("term.messages", messages => {
        messages.forEach(i => this.writeLn(i));
      })
      .on("term.error", text => {
        this.writeLn({
          component: "alert",
          text,
          type: "error"
        });
      });
  }

  mounted() {
    this.writeLn({
      component: "alert",
      type: "info",
      text: `  Welcome to Iotex Studio v0.0.1.`
    });
  }
}
</script>

<style lang="stylus" scoped>
.terminal
  color white
  .content
    overflow auto
  .input-bar
    height 30px
    >>> .el-input__inner
      color white
      height 30px
      line-height 30px
      background transparent
      border none
  >>> .el-alert
    background transparent !important
</style>
