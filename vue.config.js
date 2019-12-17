/**
 * @typedef { import("@vue/cli-service").ProjectOptions } Options
 */

const { ProvidePlugin } = require("webpack");

/** @type {Options} */
const options = {
  configureWebpack: {
    resolve: {
      alias: {
        fs: "browserfs/dist/shims/fs.js",
        buffer: "browserfs/dist/shims/buffer.js",
        path: "browserfs/dist/shims/path.js",
        processGlobal: "browserfs/dist/shims/process.js",
        bufferGlobal: "browserfs/dist/shims/bufferGlobal.js",
        bfsGlobal: require.resolve("browserfs")
      }
    },
    module: {
      noParse: [/browserfs\.js/]
    },
    plugins: [new ProvidePlugin({ BrowserFS: "bfsGlobal", process: "processGlobal", Buffer: "bufferGlobal" })],
    node: {
      process: false,
      Buffer: false,
      module: false
    }
  }
};

module.exports = options;
