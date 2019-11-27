<template lang="pug">
  .compiler.flex.flex-col
    el-form(label-position="left" label-width="80px" )
      el-form-item(label="Compiler")
        el-select(v-model="solc.version")
          el-option(v-for="item in solc.versions.releases" :key="item" :label="item" :value="item")
      div.mt-2.w-full
        el-button.w-full(@click="compile" :loading="solc.loading || solc.compileLoading" size="small" type="primary") Compile
      .contract.mt-4(v-if="currentContractName")
        el-form-item(label="Contract")
          el-select(v-model="currentContractName")
            el-option(v-for="item in solc.compileResult" :key="item.name" :label="item.name" :value="item")
        div.flex.justify-end
          el-button(icon="el-icon-document" type="text" @click="copyAbi" :disabled="!$_.get(currentContract, 'abi')") ABI
          el-button(icon="el-icon-document" type="text" @click="copyBytecode" :disabled="!$_.get(currentContract, 'binary')") Bytecode

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
  @Sync("editor/fileManager@files") files: EditorStore["fileManager"]["files"];

  currentContractName: string = null;

  async compile() {
    if (!this.solc.compiler) return;
    this.solc = { ...this.solc, ...{ compileLoading: true } };
    let _errs = [];
    let _result = {};

    await Promise.all(
      this.files.map(async file => {
        if (!file.content.includes("contract")) return;
        const [errs, result] = await Helper.runAsync(this.solc.compiler(file.content));
        const compileResult = _.keyBy(result, "name");
        if (errs) {
          _errs = [..._errs, ...errs];
          return;
        }
        _result = { ..._result, ...compileResult };
      })
    );

    this.editor.session.clearAnnotations();
    if (_errs.length > 0) {
      const errs = _errs.map(err => {
        const [m] = err.formattedMessage.match(/\d+:\d+/);
        const [row, column] = m.split(":");
        return {
          type: "error",
          text: err.formattedMessage,
          row: row - 1,
          column
        };
      });
      eventBus.emit(
        "term.messages",
        errs.map(i => {
          const { text, type } = i;
          return {
            component: "alert",
            type: "error",
            text
          };
        })
      );
      this.editor.session.setAnnotations(errs);
      return;
    }
    this.solc = { ...this.solc, ...{ compileLoading: false } };
    console.log(_result);
    this.solc = { ...this.solc, ...{ compileResult: _result } };
    this.currentContractName = Object.keys(_result)[0];
    eventBus.emit("solc.compiled", _result);
  }

  async initSolc() {
    const versions = await solcjs.versions();
    this.solc = { ...this.solc, ...{ versions } };

    await this.onSolcVersionChange();
  }

  async copyAbi() {
    const abi = _.get(this.currentContract, "abi");
    const abiString = JSON.stringify(abi);
    await this.$copyText(abiString);
    this.$message.success("Copied value to clipboard");
  }

  async copyBytecode() {
    const bytecode = _.get(this.currentContract, "binary.bytecodes.bytecode");
    await this.$copyText(bytecode);
    this.$message.success("Copied value to clipboard");
  }

  get currentContract() {
    return this.solc.compileResult[this.currentContractName];
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
