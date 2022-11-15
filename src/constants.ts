import path from "path";

export const homePath = process.env["HOME"] || `/Users/${process.env["USER"]}`;
export const appPath = path.resolve(homePath, ".csbc");
export const mirrorsPath = path.resolve(appPath, "mirrors.json");
export const metadatasSavePath = path.resolve(
  homePath,
  ".csbc/.metadatas.json"
);
export const templatesDir = path.resolve(homePath, ".csbc/template");
export const configPath = path.resolve(appPath, "config.json");
