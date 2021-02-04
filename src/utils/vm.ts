import VM from "ethereumjs-vm";
import abi from "ethereumjs-abi";
import { Transaction } from "ethereumjs-tx";
import { promisify } from "util";
import * as util from "ethereumjs-util";
import Account from "ethereumjs-account";
import { Wallet, utils } from "ethers";
import { eventBus } from "./eventBus";
import { truncate } from "./filter";

export class JSVM {
  vm = new VM();

  async generateAccount() {
    const account = new Account({ balance: 1e18 * 100 });
    const wallet = Wallet.createRandom();

    const privateKey = wallet.privateKey.replace(/^0x/, "");
    const privateKeyBuffer = Buffer.from(privateKey, "hex");
    const addressBuffer = util.privateToAddress(privateKeyBuffer);

    await this.vm.pStateManager.putAccount(addressBuffer, account);
    return {
      address: wallet.address.replace(/^0x/, "io").toLowerCase(),
      addressBuffer,
      privateKey,
      privateKeyBuffer,
      account,
    };
  }

  async getAccountNonce(accountPrivateKey: Buffer) {
    const account = (await this.vm.pStateManager.getAccount(util.privateToAddress(accountPrivateKey))) as Account;
    return account.nonce;
  }

  async deplyContract({
    senderPrivateKey,
    bytecode,
    types = [],
    datas = [],
    gasLimit = 3000000,
    gasPrice = 1,
    value = 0,
  }: {
    senderPrivateKey: Buffer;
    bytecode: Buffer;
    types: string[];
    datas: string[];
    gasLimit?: number;
    gasPrice?: number;
    value?: number;
  }): Promise<string> {
    const params = abi.rawEncode(types, datas);
    const nonce = await this.getAccountNonce(senderPrivateKey);
    let data = "0x" + bytecode.toString("hex") + params.toString("hex");

    const tx = new Transaction({
      value,
      gasLimit,
      gasPrice,
      data,
      nonce,
    });

    tx.sign(senderPrivateKey);
    const deploymentResult = await this.vm.runTx({ tx });
    if (deploymentResult.execResult.exceptionError) {
      throw deploymentResult.execResult.exceptionError;
    }

    return util.bufferToHex(deploymentResult.createdAddress).replace(/^0x/, "io");
  }

  async readContract({ contractAddress, callerAddress, types, datas, method }: { method: string; contractAddress: string; callerAddress: string; types?: string[]; datas?: string[] }) {
    const params = abi.rawEncode(types, datas);
    let data = "0x" + abi.methodID(method, types).toString("hex") + params.toString("hex");

    const _contractAddress = util.toBuffer(contractAddress.replace(/^io/, "0x"));
    const _callerAddress = util.toBuffer(callerAddress.replace(/^io/, "0x"));
    const result = await this.vm.runCall({
      to: _contractAddress,
      caller: _callerAddress,
      origin: _callerAddress,
      data: util.toBuffer(data),
    });

    eventBus.emit("term.info", {
      text: `call from: ${truncate(callerAddress, 12, "...")},to:${truncate(contractAddress, 12, "...")},data:${truncate(data, 12, "...")} `,
      data: {
        from: callerAddress,
        to: contractAddress,
        data,
      },
    });

    if (result.execResult.exceptionError) {
      throw result.execResult.exceptionError;
    }
    return result;
  }

  getData({ types = [], datas = [], method }: { types?: string[]; datas?: string[]; method: string }) {
    datas = datas.map((i) => i.replace(/^io/, "0x"));
    const params = abi.rawEncode(types, datas);
    let data = abi.methodID(method, types).toString("hex") + params.toString("hex");
    return data;
  }

  async interactContract({
    gasLimit = 2000000,
    gasPrice = 1,
    value = 0,
    senderPrivateKey,
    contractAddress,
    types = [],
    datas = [],
    method,
  }: {
    method: string;
    senderPrivateKey: Buffer;
    contractAddress: string;
    types?: string[];
    datas?: string[];
    gasLimit?: number;
    gasPrice?: number;
    value?: number;
  }) {
    const params = abi.rawEncode(types, datas);
    const nonce = await this.getAccountNonce(senderPrivateKey);
    let data = "0x" + abi.methodID(method, types).toString("hex") + params.toString("hex");
    const _contractAddress = util.toBuffer(contractAddress.replace(/^io/, "0x"));

    const tx = new Transaction({
      to: _contractAddress,
      value,
      gasLimit,
      gasPrice,
      data,
      nonce,
    });

    tx.sign(senderPrivateKey);
    const result = await this.vm.runTx({ tx });
    const message = {
      senderAddress: `io${tx.getSenderAddress().toString("hex")}`,
      contractAddress,
      data,
    };
    eventBus.emit("term.info", {
      text: `call from: ${truncate(message.senderAddress, 12, "...")},to:${truncate(message.contractAddress, 12, "...")},data:${truncate(message.data, 12, "...")} `,
      data: {
        from: message.senderAddress,
        to: message.contractAddress,
        data: message.data,
      },
    });

    if (result.execResult.exceptionError) {
      throw result.execResult.exceptionError;
    }
    return result;
  }
}

export const jsvm = new JSVM();
