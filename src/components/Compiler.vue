<template lang="pug">
  .compiler.flex.flex-col
    el-form(label-position="left" label-width="80px" )
      el-form-item(label="Compiler")
        el-select(v-model="solc.version")
          el-option(v-for="item in solc.versions.releases" :key="item" :label="item" :value="item")
      div.mt-2.w-full
        el-button.w-full(@click="compile" :loading="solc.loading || solc.compileLoading" type="primary") Compile
      .contract.mt-4(v-if="solc.currentContract")
        el-form-item(label="Contract")
          el-select(v-model="solc.currentContract")
            el-option(v-for="item in solc.compileResult" :key="item.name" :label="item.name" :value="item")
        div.flex.justify-end
          el-button(icon="el-icon-document" type="text" @click="copyAbi" :disabled="!$_.get(solc, 'currentContract.abi')") ABI
          el-button(icon="el-icon-document" type="text" @click="copyBytecode" :disabled="!$_.get(solc, 'currentContract.binary')") Bytecode

</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { Sync } from "vuex-pathify";
import { eventBus } from "../utils/eventBus";
import { _ } from "../utils/lodash";
import solcjs from "solc-js";
import { Helper } from "../utils/helper";
import { EditorStore } from "../store/type";

@Component
export default class Compiler extends Vue {
  @Sync("editor/solc") solc: EditorStore["solc"];
  @Sync("editor/ace@content") content: string;
  @Sync("editor/ace@editor") editor: EditorStore["ace"]["editor"];

  async compile() {
    this.solc = { ...this.solc, ...{ compileLoading: true } };
    localStorage.setItem("content", this.content);
    const [errs, result] = await Helper.runAsync(this.solc.compiler(this.content, 1));
    this.editor.session.clearAnnotations();
    this.solc = { ...this.solc, ...{ compileLoading: false } };
    if (errs) {
      this.editor.session.setAnnotations(
        errs.map(err => {
          const [m] = err.formattedMessage.match(/\d+:\d+/);
          const [row, column] = m.split(":");
          return {
            type: "error",
            text: err.formattedMessage,
            row: row - 1,
            column
          };
        })
      );
      return;
    }

    const compileResult = _.keyBy(result, "name");
    this.solc = { ...this.solc, ...{ compileResult, currentContract: _.get(result, "0") } };
    eventBus.emit("solc.compiled", compileResult);
  }

  async initSolc() {
    const versions = await solcjs.versions();
    this.solc = { ...this.solc, ...{ versions } };

    await this.onSolcVersionChange();
  }

  async copyAbi() {
    const abi = _.get(this.solc, "currentContract.abi");
    const abiString = JSON.stringify(abi);
    await this.$copyText(abiString);
    this.$message.success("Copied value to clipboard");
  }

  async copyBytecode() {
    const bytecode = _.get(this.solc, "currentContract.binary.bytecodes.bytecode");
    await this.$copyText(bytecode);
    this.$message.success("Copied value to clipboard");
  }

  @Watch("solc.version")
  async onSolcVersionChange(val = this.solc.version) {
    this.solc = { ...this.solc, ...{ loading: true } };
    const compiler = await solcjs(val);
    this.solc = { ...this.solc, ...{ compiler, loading: false } };
  }

  created() {
    this.initSolc();
    eventBus.on("solc.compile", () => {
      this.compile();
    });
  }
}
</script>
