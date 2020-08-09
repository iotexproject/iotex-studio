// import solcjsCore from "solcjs-core-fix";
// import solcVersion from "solc-version";
import { resolverEngine } from "solc-resolver";
import resolveGithub from "../plugins/resolve-github";
import resolveHttp from "resolve-http";
import store from "@/store";
import path from "path";
import { Compiler } from "remix-solidity";
import { CompilerAbstract } from "./compiler-abstract";

// const solcWrapper = solcjsCore.solcWrapper.wrapper;
export class SolcmManager {
  static resolveEngine = new resolverEngine().addResolver(resolveGithub).addResolver(resolveHttp);
  static compiler = new Compiler(() => {});
  static async loadSolc(version) {
    // const url = await solcVersion.version2url(version);
    const url = `https://solc-bin.ethereum.org/wasm/${version}`;
    // const url = `https://solc-bin.ethereum.org/wasm/soljson-v0.5.14+commit.01f1aaa4.js`;
    //  let compilersource = await solcjsCore.getCompilersource(url);
    this.compiler.loadVersion(false, url);
    //  const solcjson = solcjsCore.loadModule(compilersource);
    //  const compiler = (this.compiler = solcWrapper(solcjson));
    return this.compiler;
  }

  static urlFromVersion(version) {
    return `https://solc-bin.ethereum.org/wasm/${version}`;
  }

  static async compile({ name, content, version }: { name: string; content: string; version: string }) {
    return new Promise((resolve, reject) => {
      const compiler = new Compiler(() => {});
      console.log("start compile");
      compiler.set("language", "Solidity");
      compiler.loadVersion(false, this.urlFromVersion(version));
      compiler.event.register("compilationFinished", (success, compilationData, source) => {
        console.log({ success, compilationData, source });
        resolve(new CompilerAbstract(version, compilationData, source));
      });
      compiler.event.register("compilerLoaded", (_) => compiler.compile({ test: { content } }, "test.sol"));
    });

    content = content.replace(/"..\//g, `"${path.dirname(path.dirname(name))}/`).replace(/".\//g, `"${path.dirname(name)}/`);

    let readCallback = await solcjsCore.getReadCallback(content, async (filePath: string) => {
      const { files } = store.state.editor.fileManager;
      const _filePath = path.resolve(path.dirname(name), filePath);
      const file = files[filePath] || files[_filePath];

      if (file) {
        let _content = file.content.replace(/"..\//g, `"${path.dirname(path.dirname(filePath))}/`).replace(/".\//g, `"${path.dirname(filePath)}/`);

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
