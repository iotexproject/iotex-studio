import { Vue } from "vue-property-decorator";
import { utils } from "ethers";
export const truncate = (fullStr = "", strLen, separator = "") => {
  if (fullStr.length <= strLen) return fullStr;

  separator = separator || "...";

  const sepLen = separator.length;
  const charsToShow = strLen - sepLen;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars);
};

Vue.filter("truncate", (val, length, separator) => truncate(val, length, separator));
Vue.filter("formatEther", val => utils.formatEther);
