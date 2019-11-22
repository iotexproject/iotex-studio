<template lang="pug">
  .flex.flex-col
    el-form(label-position="left" label-width="80px" )
      el-form-item(label="Environment")
        el-select(v-model="currentEnvironment")
          el-option(v-for="item in environments" :key="item" :label="item" :value="item")
      el-form-item(label="Account")
        el-select(v-model="accountIndex")
          el-option(v-for="(item, index) in accounts" :key="index" :label="accountLabel(item)" :value="index")
      .contract.mt-4
        el-select.w-full(v-model="currentContract")
          el-option(v-for="item in contracts" :key="item.name" :label="item.name" :value="item")
        .flex.mt-4(v-if="currentContract")
          el-button(style="width: 100px;min-width: 100px;height: 40px" size="small" @click="deployContract") Deploy
          el-input(:placeholder="cstr.placeholder" v-model="cstr.input.value")
      .deplyed-contracts.mt-6.text-sm
        .flex
          p.mb-2.text-sm.text-gray-800.font-bold Deployed Contracts
        .p-2.rounded.border(v-for="(contract, index) in deployedContracts" :key="index")
          .flex.justify-between
            div.mb-2 {{contract.name}} at {{contract.address|truncate(12, "...")}}
            div.cursor-pointer(@click="deleteContract(contract)")
              el-icon.el-icon-delete
          .flex.my-2(v-for="(func,index) in $_.get(contract, 'abi.function')" :key="index")
            el-button(@click="interactContract({func, contract })" style="width: 100px;min-width: 100px; height: 40px" size="small") {{func.name}}
            div
              el-input(v-if="func.inputs.length > 0" :placeholder="parseInputs(func)" v-model="func.inputs[0].value")
              p(v-for="(result, index) in  func.results" :key="index") {{index}} : {{result}}

        

</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Sync } from "vuex-pathify";
import { EditorStore } from "../store/type";
import { eventBus } from "../utils/eventBus";
import { _ } from "../utils/lodash";
import { jsvm } from "../utils/vm";
import { truncate } from "../utils/filter";
import * as util from "ethereumjs-util";
import { utils } from "ethers";
import abi from "ethereumjs-abi";
import path from "path";

@Component
export default class Deployer extends Vue {
  @Sync("editor/solc") solc: EditorStore["solc"];
  accounts: {
    address: string;
    addressBuffer: Buffer;
    privateKey: string;
    privateKeyBuffer: Buffer;
    account: any;
  }[] = [];
  accountIndex = 0;

  contracts: any = {};
  currentContract: any = null;

  deployedContracts: {
    [key: string]: {
      name: string;
      address: string;
      visible: boolean;
      abi: any;
    };
  } = {};

  environments = ["JavaScript VM"];
  currentEnvironment = "JavaScript VM";

  async deployContract() {
    const { privateKey } = this.account;
    const { bytecode, name, abi } = this.currentContract;
    const { type, value } = this.cstr.input;
    console.debug({ senderPrivateKey: new Buffer(privateKey, "hex"), bytecode: Buffer.from(bytecode, "hex"), types: [type], datas: [value] });
    const address = await jsvm.deplyContract({ senderPrivateKey: new Buffer(privateKey, "hex"), bytecode: new Buffer(bytecode, "hex"), types: [type], datas: [value] });

    this.deployedContracts[address] = { address, name, abi, visible: false };
    this.reloadAccounts();
  }

  async interactContract({ func, contract }) {
    const { privateKey } = this.account;
    const { address } = contract;
    const { inputs, outputs } = func;
    const inputTypes = inputs.map(i => i.type);
    const outputTypes = outputs.map(i => i.type);

    const datas = inputs.map(i => i.value || "");

    console.log({ method: func.name, senderPrivateKey: new Buffer(privateKey, "hex"), contractAddress: util.toBuffer(address), types: inputTypes, datas });
    const result = await jsvm.interactContract({ method: func.name, senderPrivateKey: new Buffer(privateKey, "hex"), contractAddress: util.toBuffer(address), types: inputTypes, datas });

    if (outputTypes.length > 0) {
      const results = abi.rawDecode(outputTypes, result.execResult.returnValue);
      func.results = results;
    }
    this.reloadAccounts();
  }

  reloadAccounts() {
    this.accounts.forEach(async (o, i) => {
      this.accounts[i].account = await jsvm.vm.pStateManager.getAccount(o.addressBuffer);
    });
  }

  deleteContract(contract) {
    console.log(contract);
    this.$delete(this.deployedContracts, contract.address);
  }

  async genAccounts() {
    this.accounts = await Promise.all(_.range(0, 4).map(() => jsvm.generateAccount()));
  }

  accountLabel(item) {
    return `${truncate(item.address, 12, "...")} ${utils.formatEther(item.account.balance)} ether`;
  }

  parseInputs(item) {
    const input = _.get(item, "inputs.0");
    if (!input) return null;
    return `${input.name} ${input.type}`;
  }

  get account() {
    return this.accounts[this.accountIndex];
  }

  get cstr() {
    const cstr = _.get(this.currentContract, "abi.constructor.0");
    const input = _.get(cstr, "inputs.0", {});
    return {
      cstr,
      input,
      placeholder: `${input.name} ${input.type}`
    };
  }

  created() {
    this.genAccounts();
    eventBus.on("solc.compiled", result => {
      _.each(result, (v, k) => {
        const { name } = v;
        const abi = _.groupBy(v.abi, "type");
        const bytecode = _.get(v, "binary.bytecodes.bytecode");
        this.contracts[k] = { name, abi, bytecode };
        if (!this.currentContract) {
          this.currentContract = this.contracts[k];
        }
      });
    });
  }
}
</script>
