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

export const antenna = new Antenna("https://api.testnet.iotex.one:443", {
  signer: wsSigner
});
