import store from "@/store";
import { eventBus } from "./eventBus";
import { fs } from "./fs";
import { jsvm } from "./vm";
import { helper } from "./helper";
import { _ } from "./lodash";
import { antenna } from "./antenna";
import { sf } from "./sharefolder";

export const app = {
  store,
  eventBus,
  fs,
  jsvm,
  helper,
  _,
  antenna,
  sf,
};
