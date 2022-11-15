import fs from "fs-extra";
import i18n from "./i18n";
import utils from "./util";

export async function clearCache(savePath: string) {
  if (fs.existsSync(savePath)) {
    fs.unlinkSync(savePath);
    utils.success(i18n.get("config.clear.success"));
  }
}
