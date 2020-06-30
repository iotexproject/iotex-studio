<template lang="pug">
  .compiler.flex.flex-col
    .flex.mb-2.text-sm.font-bold SOLIDITY COMPILER
    el-form(label-position="left" label-width="80px" )
      el-form-item(label="Compiler")
        el-select(v-model="version")
          el-option(v-for="item in solc.versions.releases" :key="item" :label="item" :value="item")
      div.mt-2.w-full
        el-button.w-full(@click="compile" :loading="solc.loading || solc.compileLoading" size="small" type="primary") Compile
      .contract.mt-4(v-if="currentContractName")
        el-form-item(label="Contract")
          el-select(v-model="currentContractName")
            el-option(v-for="item in solc.compileResult" :key="item.name" :label="item.name" :value="item.name")
        div.flex.justify-end
          el-button(icon="el-icon-document" type="text" @click="copyAbi" :disabled="!$_.get(currentContract, 'abi')") ABI
          el-button(icon="el-icon-document" type="text" @click="copyBytecode" :disabled="!$_.get(currentContract, 'evm.bytecode.object')") Bytecode

</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { Sync, Get } from "vuex-pathify";
import { eventBus } from "../utils/eventBus";
import { _ } from "../utils/lodash";
import solcjs from "solc-js";
import { Helper } from "../utils/helper";
import { SolcmManager } from "../utils/solc";
import * as path from "path";
import { EditorStore } from "../store/editor";
import { app } from "../utils";
import { StorageStore } from "../store/storage";

@Component
export default class Compiler extends Vue {
  @Sync("editor/solc") solc: EditorStore["solc"];
  @Sync("storage/solc@version") version: string;

  @Sync("editor/ace@content") content: string;
  @Sync("editor/ace@editor") editor: EditorStore["ace"]["editor"];
  @Sync("editor/fileManager@files") files: EditorStore["fileManager"]["files"];
  @Get("editor/curFile") curFile: EditorStore["fileManager"]["file"];

  currentContractName: string = null;

  async compile() {
    try {
      if (!this.solc.compiler) return;
      this.solc = { ...this.solc, ...{ compileLoading: true } };
      const { path: filePath, content, name: fileName } = this.curFile;

      this.editor.session.clearAnnotations();
      console.log({ name: filePath, content });
      let res = await SolcmManager.compile({ name: filePath, content });
      console.log({ res });
      if (res.errors) {
        const errs = res.errors.map((err) => {
          const [m] = err.formattedMessage.match(/\d+:\d+/);
          const [row, column] = m.split(":");
          return {
            type: "error",
            text: err.formattedMessage.replace("MyContract", fileName),
            row: row - 1,
            column,
          };
        });
        eventBus.emit(
          "term.messages",
          errs.map((i) => {
            const { text, type } = i;
            return {
              component: "alert",
              type: "error",
              text,
            };
          })
        );
        this.editor.session.setAnnotations(errs);
        this.solc.compileLoading = false;
        return;
      }

      const result = {};
      _.each(res.contracts, (contracts, filePath) => {
        _.each(contracts, (contract, contractName) => {
          contract.filePath = filePath;
          contract.fileName = path.basename(filePath);
          contract.name = contractName;
          result[contractName] = contract;
        });
      });

      this.solc = { ...this.solc, ...{ compileResult: { ...this.solc.compileResult, ...result }, compileLoading: false } };
      this.currentContractName = Object.keys(result)[0];
      eventBus.emit("solc.compiled", result);
    } catch (error) {
      this.solc.compileLoading = false;
      throw error;
    }
  }

  async initSolc() {
    const [err, versions] = await app.helper.runAsync(solcjs.versions());
    if (err) {
      return eventBus.emit("term.error", {
        text: `load solc compiler versions failed: ${err}`,
      });
    }
    //@ts-ignore
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
    const bytecode = _.get(this.currentContract, "evm.bytecode.object");
    await this.$copyText(bytecode);
    this.$message.success("Copied value to clipboard");
  }

  get currentContract() {
    return this.solc.compileResult[this.currentContractName];
  }

  @Watch("solc.version")
  async onSolcVersionChange(version = this.version) {
    this.solc = { ...this.solc, ...{ loading: true } };

    const compiler = await SolcmManager.loadSolc(version);
    // const compiler = await solcjs(val);
    this.solc = { ...this.solc, ...{ compiler, loading: false } };
  }

  created() {
    this.initSolc();
    eventBus
      .on("solc.compile", () => {
        this.compile();
      })
      .on("editor.save", () => {
        this.compile();
      });
  }
}
</script>
