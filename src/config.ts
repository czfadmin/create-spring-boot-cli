import fs from "fs-extra";
import { configPath } from "./constants";
import i18n from "./i18n";
import utils from "./util";

export function loadConfig() {
  if (fs.existsSync(configPath)) {
    return fs.readJSONSync(configPath);
  } else {
    let defaultConfig = {
      lang: "zh_CN",
    };
    fs.writeJSONSync(configPath, defaultConfig);
    return defaultConfig;
  }
}

export function updateConfig(key: string, value: any) {
  let config = loadConfig();
  config[key] = value;
  fs.writeJSONSync(configPath, config);
}

export async function configAppLanguage(lang: string | boolean) {
  if (typeof lang === "boolean") {
    const quz = [
      {
        type: "rawlist",
        message: i18n.get("config.selectedLang"),
        name: "language",
        default: "zh_CN",
        choices: (answers) => {
          return [
            {
              name: "中文",
              value: "zh_CN",
            },
            {
              name: "English",
              value: "en_US",
            },
          ];
        },
      },
    ];
    const answers = await utils.prompt(quz);
    updateConfig("lang", answers["language"]);
    utils.success(i18n.get("config.changeLangSuccess"));
  } else {
    if (lang == "zh_CN" || lang == "en_US") {
      updateConfig("lang", lang);
      utils.success(i18n.get("config.changeLangSuccess"));
    } else {
      utils.error(i18n.get("config.supportLang"));
    }
  }
}
