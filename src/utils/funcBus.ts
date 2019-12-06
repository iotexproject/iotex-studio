import store from "@/store";
import * as path from "path";

export class FuncBus {
  static setConfig(_key: string, value: Object) {
    const projectDir = store.state.editor.fileManager.curDir;
    const key = path.join(projectDir, _key, "/config");
    localStorage.setItem(key, JSON.stringify(value));
  }
  static getConfig(_key: string) {
    const projectDir = store.state.editor.fileManager.curDir;
    const key = path.join(projectDir, _key, "/config");
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }
}
