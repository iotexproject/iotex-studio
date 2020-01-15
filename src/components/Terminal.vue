<template lang="pug">
  .terminal.flex.flex-col.h-full
    .content.flex-1
      .flex.flex-col-reverse.h-full.overflow-auto
        .item(v-for="(item,index) in stdout" :key="index")
          div(@click="item.expanded = !item.expanded") 
            el-alert(v-if="item.component='alert'" :title="item.text" :type="item.type" show-icon :description="item.description" :closable="false")
            span(v-else) {{item.text}}
          .flex.flex-col.detail.px-6.text-xs(v-if="item.data && item.expanded")
            div.flex.justify-between(v-for="(value, key) in item.data" :key="key")
              div {{key}}:
              div
                span {{value}}
                span(@click="copyText(value)")
                  el-icon.el-icon-document-copy.cursor-pointer.ml-2(class="hover:text-blue-600" )
    .input-bar.flex.px-2.w-full.items-center
      span >
      el-input.input(v-model="input" @keyup.enter.native="runCommand" size="small")
    
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
  input = null;
  stdin = [];
  stdout = [];

  async copyText(text) {
    await this.$copyText(text);
    this.$message.success("Copied value to clipboard");
  }

  runCommand() {
    this.input = null;
  }

  writeLn(data: StdoutType) {
    this.stdout.unshift({ ...data, expanded: false });
  }

  created() {
    eventBus
      .on("term.message", message => {
        this.writeLn(message);
      })
      .on("term.messages", messages => {
        messages.forEach(i => this.writeLn(i));
      })
      .on("term.error", message => this.writeLn({ component: "alert", type: "error", ...message }))
      .on("term.success", message => this.writeLn({ component: "alert", type: "success", ...message }))
      .on("term.warning", message => this.writeLn({ component: "alert", type: "warning", ...message }))
      .on("term.info", message => this.writeLn({ component: "alert", type: "info", ...message }));
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
@import '../assets/global.styl'

.terminal
  color white
  .content
    overflow auto
  .detail
    color #909399
  .input-bar
    height 24px
    background-color lighten(color-dark, 5)
    >>> .el-input__inner
      color white
      height 24px
      line-height 24px
      border none
      background-color lighten(color-dark, 5)
  >>> .el-alert
    background transparent !important
</style>
