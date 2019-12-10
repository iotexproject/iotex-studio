import { _ } from "./utils/lodash";

declare module "*.vue" {
  import Vue from "vue";

  export default Vue;
}

declare module "vue/types/vue" {
  interface Vue {
    $_: _;
  }
}
