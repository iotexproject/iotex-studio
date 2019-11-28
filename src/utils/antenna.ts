import Antenna from "iotex-antenna";
import { WsSignerPlugin } from "./ws-plugin";

export const wsSigner = new WsSignerPlugin();

export const antenna = new Antenna("http://api.testnet.iotex.one:80", {
  signer: wsSigner
});
