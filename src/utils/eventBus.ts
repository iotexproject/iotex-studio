import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import ace from "brace";
import { EditorStore, StdoutType } from "../store/type";

interface MessageEvents {
  "editor.init": (editor: ace.Editor) => void;
  "editor.content.update": (content: string) => void;
  "solc.compile": () => void;
  "solc.compiled": (result: EditorStore["solc"]["compileResult"]) => void;
  "term.message": (message: StdoutType) => void;
  "term.error": (text: string) => void;
  "term.messages": (messages: StdoutType[]) => void;
  "fs.ready": () => void;
}

export const eventBus = new EventEmitter() as TypedEmitter<MessageEvents>;

eventBus.on("editor.init", editor => {
  require("brace/ext/language_tools");
  require("brace/mode/javascript");
  require("brace/theme/chrome");
  require("ace-mode-solidity/build/remix-ide/mode-solidity");
  require("brace/snippets/javascript");
  editor.commands.addCommand({
    name: "SaveAndCompile",
    bindKey: { win: "Ctrl-S", mac: "Command-S" },
    exec: () => {
      eventBus.emit("solc.compile");
    }
  });
});
