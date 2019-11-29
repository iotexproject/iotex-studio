<template lang="pug">
  .deployer.flex.flex-col
    el-form(label-position="left" label-width="80px" )
      el-form-item(label="Environment")
        el-select(v-model="currentEnvironment" )
          el-option(v-for="item in environments" :key="item" :label="item" :value="item")
      el-form-item(label="Account")
        el-select(v-model="accountIndex")
          el-option(v-for="(item, index) in accounts" :key="index" :label="accountLabel(item)" :value="index")
      el-form-item(label="Gas Limit")
        el-input(v-model="form.gasLimit" size="small")
      el-form-item(label="Value")
        .flex
          el-input(v-model="form.value" size="small")
          el-select(v-model="form.valueType" size="small")
            el-option(v-for="(item, index) in valueTypes" :key="index" :label="item" :value="item")
      .contract.mt-4
        el-select.w-full(v-model="currentContractName")
          el-option(v-for="(item, index) in contracts" :key="index" :label="item.name" :value="item.name") {{item.name}}
        
        .flex.mt-4(v-if="currentContract")
          el-button(style="width: 100px;min-width: 100px;height: 40px" size="small" @click="deployContract") Deploy
          el-input(:placeholder="parseInputs($_.get(currentContract, 'abi.constructor.0'))" v-if="$_.get(currentContract, 'abi.constructor.0')"  v-model="deployForm.constructorInput")
        .flex.mt-4(v-if="currentContract")
          el-button(style="width: 100px;min-width: 100px;height: 40px" size="small" @click="deployContractFromAddress") At Address
          el-input(placeholder="Loadd contract from Address"  v-model="deployForm.atContractInput")
      .deplyed-contracts.mt-6.text-sm
        .flex.mb-2.text-sm.text-gray-800.font-bold Deployed Contracts
        .p-2.rounded.border(v-for="(contract, index) in deployedContracts" :key="index")
          .flex.justify-between
            div.mb-2 {{contract.name}} at {{contract.address|truncate(12, "...")}}
            div.cursor-pointer(@click="deleteContract(contract)")
              el-icon.el-icon-delete
          .flex.my-2(v-for="(func,index) in $_.get(contract, 'abi.function')" :key="index")
            el-button(@click="interactContract({func, contract })" style="width: 100px;min-width: 100px; height: 40px" size="small") {{func.name}}
            div
              el-input(v-if="func.inputs.length > 0" :placeholder="parseInputs(func)" v-model="func.datas")
              p(v-for="(result, index) in  func.results" :key="index") {{index}} : {{result}}

        

</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
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
import { defaultTypeValue } from "../utils/constant";
import { Helper } from "../utils/helper";
import { wsSigner, antenna } from "../utils/antenna";
import { toRau } from "iotex-antenna/lib/account/utils";
import retryPromise from "promise-retry";

@Component
export default class Deployer extends Vue {
  @Sync("editor/solc") solc: EditorStore["solc"];
  accounts: {
    address: string;
    addressBuffer?: Buffer;
    privateKey?: string;
    privateKeyBuffer?: Buffer;
    account?: any;
  }[] = [];
  deployForm = {
    constructorInput: null,
    atContractInput: null
  };
  deployedContracts: {
    [key: string]: {
      name: string;
      address: string;
      visible: boolean;
      abi: any;
    };
  } = {};

  form = {
    gasLimit: 3000000,
    gasPrice: 1,
    value: 0,
    valueType: "wei"
  };
  valueTypes = ["wei", "gwei", "finney", "ether"];
  accountIndex = 0;

  contracts: any = {};
  currentContractName: string = null;

  environment: "JavaScript VM" | "Injencted ioPay";
  environments: Deployer["environment"][] = ["JavaScript VM", "Injencted ioPay"];
  currentEnvironment: Deployer["environment"] = "JavaScript VM";

  async deployContractFromAddress() {
    try {
      const { atContractInput: address } = this.deployForm;
      const { bytecode, name, abiRaw, abi } = this.currentContract;

      this.$set(this.deployedContracts, address, { address, name, abi: _.cloneDeep(abi), abiRaw, visible: false });
    } catch (error) {
      eventBus.emit("term.message", { component: "alert", type: "error", text: error });
    }
  }

  async deployContract() {
    try {
      const { privateKey = "", address: callerAddress } = this.account;
      const { bytecode, name, abiRaw, abi } = this.currentContract;
      const { constructorInput } = this.deployForm;
      let { gasLimit, gasPrice } = this.form;
      const { value } = this;
      const senderPrivateKey = new Buffer(privateKey, "hex");
      const { inputs = [] } = _.get(this.currentContract, "abi.constructor.0", {});

      const types = inputs.map(i => i.type);
      const datas = constructorInput ? constructorInput.split(/,(?![^(]*\)) /) : [];
      types.forEach((o, i) => {
        if (!datas[i]) {
          datas[i] = defaultTypeValue[o];
        }
      });

      let address, actionHash;
      switch (this.currentEnvironment) {
        case "JavaScript VM":
          console.debug({ senderPrivateKey, bytecode: new Buffer(bytecode, "hex"), types, datas, gasLimit, value });

          address = await jsvm.deplyContract({ senderPrivateKey, bytecode: new Buffer(bytecode, "hex"), types, datas, gasLimit, value });
          break;
        case "Injencted ioPay":
          console.debug({ from: callerAddress, amount: String(value), data: bytecode, abi: JSON.stringify(abiRaw), gasLimit: String(gasLimit), gasPrice: toRau(String(gasPrice), "Qev"), datas });

          actionHash = await antenna.iotx.deployContract(
            { from: callerAddress, amount: String(value), data: Buffer.from(bytecode, "hex"), abi: JSON.stringify(abiRaw), gasLimit: String(gasLimit), gasPrice: toRau(String(gasPrice), "Qev") },
            ...datas
          );
          break;
      }

      if (actionHash) {
        eventBus.emit("term.message", { text: `Deploy Contract: ${name}, actionHash: ${actionHash}` });
        await retryPromise((retry, number) => antenna.iotx.getReceiptByAction({ actionHash }).catch(retry), { retries: 3, minTimeout: 10000, maxTimeout: 10000 }).then(
          async value => {
            address = value.receiptInfo.receipt.contractAddress;
          },
          async err => {
            eventBus.emit("term.message", { text: `Failed to check action receipt ${err}` });
          }
        );
      }

      if (address) {
        eventBus.emit("term.message", {
          component: "alert",
          type: "success",
          text: `Deploy Contract: ${name}, \n Address: ${address}`
        });
        this.$set(this.deployedContracts, address, { address, name, abi: _.cloneDeep(abi), abiRaw, visible: false });
        this.reloadAccounts();
      }
    } catch (error) {
      eventBus.emit("term.message", { component: "alert", type: "error", text: error });
    }
  }

  async interactContract({ func, contract }) {
    try {
      const { privateKey = "", address: callerAddress } = this.account;
      const { address: contractAddress, abiRaw } = contract;
      const { inputs, outputs, stateMutability } = func;
      let { gasLimit, gasPrice } = this.form;
      const { value } = this;
      const { name: method } = func;

      const types = inputs.map(i => i.type);
      const outputTypes = outputs.map(i => i.type);
      const datas = func.datas ? func.datas.split(",") : [];
      types.forEach((o, i) => {
        if (!datas[i]) {
          datas[i] = defaultTypeValue[o];
        }
      });
      let callFunc, err, result;

      const isReadFunc = stateMutability == "view";

      switch (this.currentEnvironment) {
        case "JavaScript VM":
          const senderPrivateKey = new Buffer(privateKey, "hex");

          callFunc = isReadFunc
            ? jsvm.readContract({
                method,
                contractAddress,
                callerAddress,
                types,
                datas
              })
            : jsvm.interactContract({
                method,
                senderPrivateKey,
                contractAddress,
                types,
                datas,
                value,
                gasLimit
              });

          console.log({ method, senderPrivateKey, callerAddress, contractAddress: util.toBuffer(contractAddress), types, datas, value, gasLimit });
          [err, result] = await Helper.runAsync(callFunc);
          if (err) {
            console.error({ err });
            return eventBus.emit("term.message", {
              component: "alert",
              type: "error",
              text: `call to ${contract.name}.${method} errored: ${err.errorType}: ${err.error}`
            });
          }

          const results = abi.rawDecode(outputTypes, result.execResult.returnValue);
          if (outputTypes.length > 0) {
            func.results = results;
          }
          this.reloadAccounts();
          break;
        case "Injencted ioPay":
          console.log({ abi: JSON.stringify(abiRaw), from: callerAddress, method, contractAddress, gasLimit: String(gasLimit), gasPrice: toRau(String(gasPrice), "Qev"), datas });

          callFunc = isReadFunc
            ? antenna.iotx.readContractByMethod(
                { abi: JSON.stringify(abiRaw), from: callerAddress, method, contractAddress, gasLimit: String(gasLimit), gasPrice: toRau(String(gasPrice), "Qev") },
                ...datas
              )
            : antenna.iotx.executeContract(
                { amount: String(value), abi: JSON.stringify(abiRaw), from: callerAddress, method, contractAddress, gasLimit: String(gasLimit), gasPrice: toRau(String(gasPrice), "Qev") },
                ...datas
              );

          [err, result] = await Helper.runAsync(callFunc);

          if (err) {
            console.error({ err });
          }
          if (result && isReadFunc) {
            this.$set(func, "results", [result.toString()]);
          }
          break;
      }
    } catch (error) {
      eventBus.emit("term.message", { component: "alert", type: "error", text: error });
    }
  }

  reloadAccounts() {
    if ((this.environment = "JavaScript VM")) {
      this.accounts.forEach(async (o, i) => {
        this.accounts[i].account = await jsvm.vm.pStateManager.getAccount(o.addressBuffer);
      });
    }
  }

  deleteContract(contract) {
    console.log(contract);
    this.$delete(this.deployedContracts, contract.address);
  }

  accountLabel(item) {
    if (!item.account) return item.address;
    return `${truncate(item.address, 12, "...")} ${utils.formatEther(item.account.balance)} ether`;
  }

  parseInputs(item) {
    if (item.inputs.length == 0) return null;
    return item.inputs.map(input => `${input.name} ${input.type}`);
  }

  async initJSVM() {
    this.accounts = await Promise.all(_.range(0, 4).map(() => jsvm.generateAccount()));
  }

  async initAntenna() {
    const [err, accounts] = await Helper.runAsync(wsSigner.getAccounts());
    if (err) {
      return eventBus.emit("term.message", {
        component: "alert",
        type: "error",
        text: err
      });
    }

    this.accounts = accounts;
  }

  get value() {
    let { value: _value, valueType } = this.form;

    return Number(utils.parseUnits(_value.toString(), valueType));
  }

  get account() {
    return this.accounts[this.accountIndex];
  }

  get currentContract() {
    return this.contracts[this.currentContractName];
  }

  @Watch("currentContractName")
  onContractChange() {
    this.deployForm = {
      constructorInput: null,
      atContractInput: null
    };
  }

  @Watch("currentEnvironment")
  onEnvironmentChange() {
    switch (this.currentEnvironment) {
      case "JavaScript VM":
        return this.initJSVM();
      case "Injencted ioPay":
        return this.initAntenna();
    }
  }

  created() {
    this.initJSVM();
    eventBus.on("solc.compiled", result => {
      _.each(result, (v, k) => {
        const { name } = v;
        const abi = _.groupBy(v.abi, "type");
        const bytecode = _.get(v, "evm.bytecode.object");
        this.$set(this.contracts, k, { name, abi, abiRaw: v.abi, bytecode });

        if (!this.currentContract) {
          this.currentContractName = this.contracts[k].name;
        }
      });
    });
  }
}
</script>

<style scoped lang="stylus">
.deployer
  >>> .el-input__inner
    font-size 12px
</style>
