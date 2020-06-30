import { EventEmitter } from "events";
import TypedEmitter from "typed-emitter";
import ace from "brace";
import { StdoutType } from "../store/type";
import { FS } from "./fs";
import { EditorStore } from "../store/editor";

interface MessageEvents {
  "editor.save": () => void;
  "editor.init": (editor: ace.Editor) => void;
  "editor.content.update": (content: string) => void;
  "solc.compile": () => void;
  "solc.compiled": (result: EditorStore["solc"]["compileResult"]) => void;
  "term.message": (message: StdoutType) => void;
  "term.error": (message: StdoutType) => void;
  "term.success": (message: StdoutType) => void;
  "term.warning": (message: StdoutType) => void;
  "term.info": (message: StdoutType) => void;
  "term.messages": (messages: StdoutType[]) => void;
  "fs.ready": () => void;
  "fs.select": (file: FS["file"]) => void;
  "fs.loadFiles": (files: EditorStore["fileManager"]["files"]) => void;
  "toolbar.tab.select": (file: Partial<FS["file"]>) => void;
  "menubar.newFile": () => void;
  "menubar.newFolder": () => void;
  "menubar.undo": () => void;
  "menubar.redo": () => void;
  "menubar.saveAll": () => void;
  "sharefolder.ws.connected": () => void;
  "sharefolder.ws.closed": () => void;
}

export const eventBus = new EventEmitter() as TypedEmitter<MessageEvents>;

eventBus.on("editor.init", (editor) => {
  require("brace/ext/language_tools");
  require("brace/mode/javascript");
  require("ace-mode-solidity/build/remix-ide/mode-solidity");
  require("brace/snippets/javascript");
  editor.commands.addCommand({
    name: "SaveAndCompile",
    bindKey: { win: "Ctrl-S", mac: "Command-S" },
    exec: () => {
      eventBus.emit("editor.save");
    },
  });
});
