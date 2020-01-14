<template lang="pug">
  .deployer.flex.flex-col
    .flex.mb-2.text-sm.font-bold DEPLOY & RUN TRANSACTIONS
    el-form(label-position="left" label-width="80px" )
      el-form-item(label="Environment")
        el-select.w-full(v-model="currentEnvironment" )
          el-option(v-for="item in environments" :key="item" :label="item" :value="item")
      el-form-item(label="Account")
        el-select.w-full(v-model="accountIndex")
          el-option(v-for="(item, index) in accounts" :key="index" :label="accountLabel(item)" :value="index")
      el-form-item(label="Gas Limit")
        el-input(v-model="form.gasLimit" size="small")
      el-form-item(label="Value")
        .flex
          el-input(v-model="form.value" size="small")
          el-select(v-model="form.valueType" size="small")
            el-option(v-for="(item, index) in valueTypes" :key="index" :label="item" :value="item")
      .deploy-contract.mt-4
        el-select.w-full(v-model="currentContractName")
          el-option(v-for="(item, index) in contracts" :key="index" :label="item.name" :value="item.name") {{item.name}}
        .flex.mt-4(v-if="currentContract")
          el-button(style="width: 100px;min-width: 100px;height: 40px" size="small" @click="deployContract" type="primary") Deploy
          el-input(:placeholder="parseInputs($_.get(currentContract, 'abi.constructor.0'))" v-if="$_.get(currentContract, 'abi.constructor.0')"  v-model="deployForm.constructorInput")
        .flex.mt-4(v-if="currentContract")
          el-button(style="width: 100px;min-width: 100px;height: 40px" size="small" @click="deployContractFromAddress" :disabled="!deployForm.atContractInput" type="primary") At Address
          el-input(placeholder="Load contract from Address"  v-model="deployForm.atContractInput")
      .deplyed-contracts.mt-6.text-sm
        .flex.mb-2.text-xs.font-bold Deployed Contracts
        .contract-list.p-2.rounded.border(v-for="(contract, index) in deployedContracts" :key="index")
          .flex.justify-between.items-center
            .contract(@click="$set(contract, 'showDetail', !contract.showDetail)")
              span.contract-title
                el-icon.el-icon-arrow-up.cursor-pointer.ml-2(v-if="contract.showDetail" class="hover:text-blue-600" style="font-weight: bold;")
                el-icon.el-icon-arrow-down.cursor-pointer.ml-2(v-else class="hover:text-blue-600" style="font-weight: bold;")
              span.ml-2 {{contract.name}} at {{contract.address|truncate(12, "...")}}
            .contract-actions.cursor-pointer
              span(@click="copyText(contract.address)")
                el-icon.el-icon-document-copy.cursor-pointer.ml-2(class="hover:text-blue-600" )
              span.ml-2(@click="deleteContract(contract)")
                el-icon.el-icon-delete(class="hover:text-blue-600" )
          .contract-func-list.my-4(v-if="contract.showDetail" v-for="(func,index) in $_.get(contract, 'abi.function')" :key="index") 
            .func-full.w-full.func-detail.py-1.px-1(v-if="func.showDetail")
              .func-name.flex.justify-between.w-full.items-center(@click="$set(func, 'showDetail', !func.showDetail)")
                span {{func.name}}
                el-icon.el-icon-arrow-up.cursor-pointer.ml-2(class="hover:text-blue-600" style="font-weight: bold;")
              .func-input-list.flex.items-center.my-2(v-for="(input,index) in $_.get(func, 'inputs')" :key="index")
                span.text-right(class="w-4/12") {{input.name}}: 
                el-input.ml-2(v-model="input.value" size="mini" class="w-4/12" :placeholder="input.type")
              .func-actions.flex.justify-end.items-center
                span.mr-2(@click="copyDatafromFunc({func, contract})")
                  el-icon.el-icon-document-copy.cursor-pointer.ml-2(class="hover:text-blue-600" )
                el-button(size="small" type="primary" @click="interactContract({func, contract, fromDetail: true })")
                  span(v-if="func.stateMutability == 'view'") call
                  span(v-else) transact
            .func-bar.flex.items-center(v-else)
              el-button.func-action(@click="interactContract({func, contract })" style="width: 100px;min-width: 100px;" size="small" type="primary") {{func.name}}
              .func-input.flex-1
                el-input.w-full(v-if="func.inputs.length > 0" :placeholder="parseInputs(func)" v-model="func.datas" size="small")
              span.func-bar-actions(@click="$set(func, 'showDetail', !func.showDetail)")
                el-icon.el-icon-arrow-down.cursor-pointer.ml-2(class="hover:text-blue-600" style="font-weight: bold;")
            p(v-for="(result, index) in  func.results" :key="index") {{index}} : {{result}}

        

</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { Sync } from "vuex-pathify";
import { EditorStore, CompiledContract, AbiFunc } from "../store/type";
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
import { wsSigner, antenna, AntennaUtils } from "../utils/antenna";
import { toRau } from "iotex-antenna/lib/account/utils";
import retryPromise from "promise-retry";

@Component
export default class Deployer extends Vue {
  @Sync("editor/solc") solc: EditorStore["solc"];
  abiFuncs: CompiledContract["abi"];

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
  deployedContract: {
    name: string;
    address: string;
    visible: boolean;
    abiRaw: string;
    provider: Deployer["environment"];
    abi: {
      constructor: Deployer["abiFuncs"];
      function: Deployer["abiFuncs"];
    };
  };
  deployedContracts: {
    [key: string]: Deployer["deployContract"];
  } = {};

  form = {
    gasLimit: 3000000,
    gasPrice: 1,
    value: 0,
    valueType: "Rau"
  };
  valueTypes = ["Rau", "KRau", "MRau", "GRua", "Qev", "Jing", "Iotx"];
  accountIndex = 0;

  contracts: any = {};
  currentContractName: string = null;

  environment: "JavaScript VM" | "Injected ioPay";
  environments: Deployer["environment"][] = ["JavaScript VM", "Injected ioPay"];
  currentEnvironment: Deployer["environment"] = "JavaScript VM";

  async copyText(text) {
    await this.$copyText(text);
    this.$message.success("Copied value to clipboard");
  }

  async copyDatafromFunc({ func, contract }: { func: AbiFunc; contract: Deployer["deployedContract"] }) {
    try {
      let data;
      const { inputTypes, datas, method } = this.getFuncDatas({ func, fromDetail: true });
      switch (contract.provider) {
        case "JavaScript VM":
          data = "0x" + jsvm.getData({ types: inputTypes, datas, method });
          break;
        case "Injected ioPay":
          data = jsvm.getData({ types: inputTypes, datas, method });
          break;
      }
      await this.copyText(data);
    } catch (error) {
      eventBus.emit("term.message", { component: "alert", type: "error", text: error });
    }
  }

  async deployContractFromAddress() {
    try {
      const { atContractInput: address } = this.deployForm;
      const { bytecode, name, abiRaw, abi } = this.currentContract;
      const contract: Deployer["deployedContract"] = { address, name, abi: _.cloneDeep(abi), abiRaw, visible: false, provider: this.currentEnvironment };
      this.$set(this.deployedContracts, address, contract);
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
        case "Injected ioPay":
          console.debug({ from: callerAddress, amount: String(value), data: bytecode, abi: JSON.stringify(abiRaw), gasLimit: String(gasLimit), gasPrice: toRau(String(gasPrice), "Qev"), datas });

          const res = (await antenna.iotx.deployContract(
            { from: callerAddress, amount: String(value), data: Buffer.from(bytecode, "hex"), abi: JSON.stringify(abiRaw), gasLimit: String(gasLimit), gasPrice: toRau(String(gasPrice), "Qev") },
            ...datas
          )) as any;
          console.log(res);
          actionHash = res.actionHash;
          const providerName = _.get(res, "network.name");
          if (providerName) {
            antenna.setProvider(AntennaUtils.getProdiver(providerName));
          }

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
        eventBus.emit("term.success", {
          text: `Deploy Contract: ${name}, \n Address: ${address}`,
          data: {
            contractName: name,
            contractAddress: address
          }
        });
        const contract: Deployer["deployedContract"] = { address, name, abi: _.cloneDeep(abi), abiRaw, visible: false, provider: this.currentEnvironment };
        console.log(contract);
        this.$set(this.deployedContracts, address, contract);
        this.reloadAccounts();
      }
    } catch (error) {
      eventBus.emit("term.message", { component: "alert", type: "error", text: error });
    }
  }

  getFuncDatas({ func, fromDetail = false }: { func: AbiFunc; fromDetail?: boolean }) {
    const { inputs, outputs, name: method, stateMutability } = func;
    const inputTypes = inputs.map(i => i.type);
    const outputTypes = outputs.map(i => i.type);
    let datas;
    if (fromDetail) {
      datas = func.inputs.map(i => i.value || defaultTypeValue[i.type]);
    } else {
      datas = func.datas ? func.datas.split(",") : [];
      inputTypes.forEach((o, i) => {
        if (!datas[i]) {
          datas[i] = defaultTypeValue[o];
        }
      });
    }
    return { method, inputTypes, outputTypes, datas, stateMutability };
  }

  async interactContract({ func, contract, fromDetail }) {
    try {
      const { privateKey = "", address: callerAddress } = this.account;
      const { address: contractAddress, abiRaw } = contract;
      let { gasLimit, gasPrice } = this.form;
      const { value } = this;

      const { datas, inputTypes, outputTypes, method, stateMutability } = this.getFuncDatas({ func, fromDetail });

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
                types: inputTypes,
                datas
              })
            : jsvm.interactContract({
                method,
                senderPrivateKey,
                contractAddress,
                types: inputTypes,
                datas,
                value,
                gasLimit
              });

          console.log({ method, senderPrivateKey, callerAddress, contractAddress, types: inputTypes, datas, value, gasLimit });
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
        case "Injected ioPay":
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
    return `${truncate(item.address, 12, "...")} ${utils.formatEther(item.account.balance)} iotx`;
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

    return Number(toRau(String(_value), valueType));
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
      case "Injected ioPay":
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
@import '../assets/global.styl'

.deployer
  >>> .el-input__inner
    font-size 12px
  .func-detail
    background-color lighten(color-dark, 5%)
</style>
