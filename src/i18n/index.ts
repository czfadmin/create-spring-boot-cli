import zhCN from "./zh";
import enUS from "./en";
import utils from "../util";
import { loadConfig } from "../config";
const appConfig = loadConfig();
const lang = appConfig["lang"] == "zh_CN" ? zhCN : enUS;

function getValue(keys: any[]) {
  let idx = 0;
  let objValue: any = lang;
  while (idx < keys.length) {
    objValue = objValue[keys[idx]];
    if (typeof objValue != "object") {
      break;
    }
    idx++;
  }
  return objValue;
}
function get(key: string) {
  try {
    const keys = key.split(".");
    return getValue(keys);
  } catch (error) {
    utils.error(error.message);
  }
}

export function getAppLanguageDict(lang: string) {
  if (lang == "zh_CN") {
    return zhCN;
  } else if (lang == "en_US") {
    return enUS;
  }
}
const i18n = { zhCN, enUS, get };
export default i18n;
