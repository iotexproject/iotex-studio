import Antenna from "iotex-antenna";
import { WsSignerPlugin } from "./ws-plugin";

export const wsSigner = new WsSignerPlugin({
  options: {
    packMessage: (data) => JSON.stringify(data),
    //@ts-ignore
    unpackMessage: (data) => JSON.parse(data),
    attachRequestId: (data, requestId) => Object.assign({ reqId: requestId }, data),
    extractRequestId: (data) => data && data.reqId,
  },
});

wsSigner.readContract();

export class AntennaUtils {
  static providers = {
    mainnet: { name: "mainnet", url: "https://api.iotex.one:443" },
    testnet: { name: "testnet", url: "https://api.testnet.iotex.one:443" },
  };

  static getProdiver(name: string) {
    if (this.providers[name]) {
      return this.providers[name].url;
    }
    throw new Error(`provider ${name} not exists`);
  }
}

export const antenna = new Antenna(AntennaUtils.providers.testnet.url, {
  signer: wsSigner,
});
