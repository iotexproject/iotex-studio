import Antenna from "iotex-antenna";
import { WsSignerPlugin } from "./ws-plugin";

export const wsSigner = new WsSignerPlugin({
  options: {
    packMessage: data => JSON.stringify(data),
    //@ts-ignore
    unpackMessage: data => JSON.parse(data),
    attachRequestId: (data, requestId) => Object.assign({ reqId: requestId }, data),
    extractRequestId: data => data && data.reqId
  }
});

export class AntennaUtils {
  static getProdiver(name: string) {
    if (name == "mainnet") {
      return "https://api.iotex.one:443";
    } else if (name == "testnet") {
      return "https://api.testnet.iotex.one:443";
    } else {
      return name;
    }
  }
}

export const antenna = new Antenna("https://api.testnet.iotex.one:443", {
  signer: wsSigner
});
