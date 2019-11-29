import solcjsCore from "solcjs-core";
import solcVersion from "solc-version";
import { resolverEngine } from "solc-resolver";
import resolveGithub from "resolve-github";
import resolveHttp from "resolve-http";

const solcWrapper = solcjsCore.solcWrapper.wrapper;
export class SolcmManager {
  static resolveEngine = new resolverEngine().addResolver(resolveGithub).addResolver(resolveHttp);
  static compiler: any;
  static async loadSolc(version) {
    const url = await solcVersion.version2url(version);
    let compilersource = await solcjsCore.getCompilersource(url);
    const solcjson = solcjsCore.loadModule(compilersource);
    const compiler = (this.compiler = solcWrapper(solcjson));
    return compiler;
  }

  static async compile({ name, content }) {
    let readCallback = await solcjsCore.getReadCallback(content, async path => await this.resolveEngine.require(path));
    const res = this.compiler.compile(content, 1, readCallback);
    console.log(res);
    const {
      contracts: { MyContract: MyContract_contract, ...otherContracts },
      sources: { MyContract: MyContract_source, ...otherSources }
    } = res;

    return {
      errors: res.errors,
      contracts: {
        [name]: res.contracts.MyContract,
        ...otherContracts
      },
      sources: {
        [name]: res.sources.MyContract,
        ...otherSources
      }
    };
  }
}
