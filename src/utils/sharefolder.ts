import WebSocket from "websocket-as-promised";
import { eventBus } from "./eventBus";

export class ShareFolder {
  private ws: WebSocket;

  async start() {
    this.ws = new WebSocket("ws://localhost:65520", {
      timeout: 5000,
      connectionTimeout: 10000,
      packMessage: data => JSON.stringify(data),
      //@ts-ignore
      unpackMessage: data => JSON.parse(data),
      attachRequestId: (data, requestId) => Object.assign({ id: requestId }, data),
      extractRequestId: data => data && data.id
    });
    this.ws.onOpen.addListener(() => {
      console.log("open");
      eventBus.emit("sharefolder.ws.connected");
    });
    this.ws.onClose.addListener(() => {
      console.log("close");
      eventBus.emit("sharefolder.ws.closed");
    });
    this.ws.onError.addListener(e => {
      console.error(e);
    });
    this.ws.onMessage.addListener(e => {
      // console.log(e);
    });
    await this.ws.open();
    await this.ws.sendRequest({
      action: "request",
      key: "handshake",
      payload: ["iotex-studio"]
    });
    return this;
  }

  async ensureSocket() {
    if (this.ws?.isOpened) return this.ws;
    await this.start();
    return this.ws;
  }

  async call({ args = [], method }: { args?: any; method: string }) {
    await this.ensureSocket();
    return this.ws.sendRequest({
      action: "request",
      requestInfo: { path: "sharedfolder" },
      key: method,
      payload: args
    });
  }

  async dir() {
    const res = await this.call({ method: "list" });
    return res.payload;
  }
  async get({ path }: { path: string }) {
    const res = await this.call({ method: "get", args: [{ path }] });
    return res.payload;
  }
}

export const sf = new ShareFolder();
