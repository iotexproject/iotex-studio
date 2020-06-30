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
