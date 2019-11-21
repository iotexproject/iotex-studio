<template lang="pug">
  .compiler.flex.flex-col
    el-select(v-model="solc.version")
      el-option(v-for="item in solc.versions.releases" :key="item" :label="item" :value="item")
    el-select(v-model="solc.currentContract")
      el-option(v-for="item in solc.compileResult" :key="item.name" :label="item.name" :value="item")
    
    div.mt-4
      el-button.w-full(@click="compile" :disabled="solc.loading") Compile
    div.flex.justify-end
      el-button(icon="el-icon-document" type="text" @click="copyAbi" :disabled="!$_.get(solc, 'currentContract.abi')") ABI
      el-button(icon="el-icon-document" type="text" @click="copyBytecode" :disabled="!$_.get(solc, 'currentContract.binary')") Bytecode

</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { Sync } from "vuex-pathify";
import { EditorStore } from "../store/editor";
import { eventBus } from "../utils/eventBus";
import { _ } from "../utils/lodash";

@Component
export default class Compiler extends Vue {
  @Sync("editor/solc")
  solc: EditorStore["solc"];

  @Sync("editor/content")
  content: string;

  compile() {
    localStorage.setItem("content", this.content);
    eventBus.$emit("solc:compile");
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

  created() {
    eventBus.$on("solc:compiled", result => {});
  }
}
</script>
