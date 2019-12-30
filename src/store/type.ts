import ace from "brace";
import { FS } from "../utils/fs";

export interface StdoutType {
  text: string;
  component?: "alert" | "json";
  data?: Object;
  type?: "success" | "info" | "warning" | "error";
  description?: string;
  expanded?: boolean;
}

export interface EditorStore {
  fileManager: {
    curDir: string;
    file?: FS["file"];
    files: {
      [key: string]: EditorStore["fileManager"]["file"];
    };
    filesLoaded: FS["files"];
    defaultFiles: { path: string; content: string; ensure: boolean }[];
  };
  ace: {
    content: string;
    editor: ace.Editor;
    theme: string;
    lang: string;
    options: any;
  };
  solc: {
    version: string;
    loading: boolean;
    compileLoading: boolean;
    compiler: any;
    versions: {
      all: string[];
      nightly: string[];
      releases: string[];
    };
    compileResult: Record<string, CompiledContract>;
  };
}

export interface StorageStore {
  split: {
    size: {
      main: number[];
      editor: number[];
    };
  };
  fileManager: {
    curFilePath: string;
  };
  toolbar: {
    tabs: {
      [key: string]: Partial<FS["file"]>;
    };
  };
}

export type AbiFunc = {
  constant: boolean;
  inputs: {
    name: string;
    type: string;
    value?: string;
  }[];
  outputs: {
    name: string;
    type: string;
  }[];
  datas?: string;
  name: string;
  payable: boolean;
  stateMutability: string;
  type: string;
};

export type CompiledContract = {
  abi: AbiFunc[];
  showDetail?: boolean;
  assembly: Object;
  binary: Object;
  compiler: Object;
  metadata: Object;
  name: string;
  sources: Object;
};
