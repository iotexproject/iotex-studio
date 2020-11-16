import solcjsCore from "solcjs-core-fix";
import solcVersion from "solc-version";
import { resolverEngine } from "solc-resolver";
import resolveGithub from "../plugins/resolve-github";
import resolveHttp from "resolve-http";
import store from "@/store";
import path from "path";
import axios from "axios";

const solcWrapper = solcjsCore.solcWrapper.wrapper;
const getCompile = solcjsCore.getCompile;

export class SolcmManager {
  static resolveEngine = new resolverEngine().addResolver(resolveGithub).addResolver(resolveHttp);
  static compiler: any;
  static async loadSolc(version) {
    // const url = await solcVersion.version2url(version);
    const url = process.env.NODE_ENV == "production" ? `https://ide-solc-iotex.b-cdn.net/bin/${version}` : `/bin/${version}`;
    console.time('[fetch compiler]');
    let compilersource = await solcjsCore.getCompilersource(url);
    console.timeEnd('[fetch compiler]');
    const solcjson = solcjsCore.loadModule(compilersource);
    const compiler = (this.compiler = solcWrapper(solcjson));
    return compiler;
  }

  static async compile({ name, content }: { name: string; content: string }) {
    content = content.replace(/("|')..\//g, `$1${path.dirname(path.dirname(name))}/`).replace(/("|').\//g, `$1${path.dirname(name)}/`);

    let readCallback = await solcjsCore.getReadCallback(content, async (filePath: string) => {
      const { files } = store.state.editor.fileManager;
      const _filePath = path.resolve(path.dirname(name), filePath);
      const file = files[filePath] || files[_filePath];

      if (file) {
        let _content = file.content.replace(/("|')..\//g, `$1${path.dirname(path.dirname(filePath))}/`).replace(/("|').\//g, `$1${path.dirname(filePath)}/`);

        return _content;
      }
      if (/(openzeppelin\/|@openzeppelin\/|openzeppelin-solidity\/)/.test(filePath)) {
        filePath = filePath.replace(/(openzeppelin\/|@openzeppelin\/|openzeppelin-solidity\/)/, "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/release-v2.3.0/");
      }
      const data = await this.resolveEngine.require(filePath);

      return data;
    });
    const res = this.compiler.compile(content, 1, readCallback);
    console.log({ res });
    const {
      contracts: { MyContract: MyContract_contract, ...otherContracts } = { MyContract: {} },
      sources: { MyContract: MyContract_source, ...otherSources },
    } = res;

    return {
      errors: res.errors,
      contracts: {
        [name]: MyContract_contract,
        ...otherContracts,
      },
      sources: {
        [name]: MyContract_source,
        ...otherSources,
      },
    };
  }
}
