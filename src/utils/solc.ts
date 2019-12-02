import solcjsCore from "solcjs-core";
import solcVersion from "solc-version";
import { resolverEngine } from "solc-resolver";
import resolveGithub from "resolve-github";
import resolveHttp from "resolve-http";
import store from "@/store";
import path from "path";

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

  static async compile({ name, content }: { name: string; content: string }) {
    content = content.replace(/"..\//, `"${path.dirname(path.dirname(name))}/`);
    content = content.replace(/".\//, `"${path.dirname(name)}/`);

    let readCallback = await solcjsCore.getReadCallback(content, async (filePath: string) => {
      const { files } = store.state.editor.fileManager;
      const _filePath = path.resolve(path.dirname(name), filePath);

      const file = files[filePath] || files[_filePath];
      console.log(filePath);
      if (file) {
        return file.content;
      }
      if (/(openzeppelin\/|@openzeppelin\/|openzeppelin-solidity\/)/.test(filePath)) {
        filePath = filePath.replace(/(openzeppelin\/|@openzeppelin\/|openzeppelin-solidity\/)/, "https://github.com/OpenZeppelin/zeppelin-solidity/");
      }
      const data = await this.resolveEngine.require(filePath);

      return data;
    });
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
