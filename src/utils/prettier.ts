import prettier from "prettier/standalone";
import prettierSolidity from "prettier-plugin-solidity";

export class PrettierUtils {
  static solidity(content: string) {
    return prettier.format(content, {
      parser: "solidity-parse",
      plugins: [prettierSolidity],
      printWidth: 200,
      tabWidth: 4,
      useTabs: false,
      singleQuote: false,
      bracketSpacing: false,
      explicitTypes: "always"
    });
  }
}
