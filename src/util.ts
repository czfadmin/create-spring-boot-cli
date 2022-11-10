import chalk from "chalk";
import { execaSync } from "execa";
import Table from "cli-table3";
const log = console.log;
function info(message: string) {
  return log(chalk.blue(message));
}
function warn(message: string) {
  return log(chalk.yellow(message));
}

function error(message: string) {
  return log(chalk.red(message));
}

function success(message: string) {
  return log(chalk.green(message));
}

/**
 * 获取JDK信息
 * @returns java version info
 */
export function getJDKInfo() {
  const { stdout, exitCode } = execaSync("java", ["--version"]);
  if (exitCode !== 0) {
    throw new Error("Some error happened");
  }
  let javaVer = stdout.split("\n")[0].split(" ")[1];
  return javaVer;
}

export function outputTable(data: any) {
  const dataset: any[] = Object.entries(data);
  const head = ["", "Content"];
  const table = new Table({
    head,
    colAligns: ["center"],
    rowAligns: ["center"],
    colWidths: [20, 40],
    wordWrap: true,
    wrapOnWordBoundary: false,
  });
  dataset.forEach((it) => {
    if (it[1] instanceof Array) {
      table.push([it[0], it[1].join(",")]);
    } else {
      table.push(it);
    }
  });
  try {
    console.log(table.toString());
  } catch (error) {
    console.log(error);
  }
}

export default {
  info,
  warn,
  error,
  success,
  getJDKInfo,
};
