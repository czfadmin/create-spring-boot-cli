import chalk from "chalk";
import { execa, execaSync } from "execa";
import fs from 'fs-extra'
import Table from "cli-table3";
import inquirer from "inquirer";

import { downloadProject } from "./download";
import path from "path";

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

export function outputAnswerTable(data: any) {
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

 async function prompt(quz: any): Promise<any> {
  return inquirer.prompt(quz).catch((err) => {
    error(err.message);
    process.exit(-1);
  });
}


async function generateProject(answers: any) {
    try {
      // 将数据输出
      outputAnswerTable(answers);
      const currentLocation = process.cwd();
      const savePath = answers["location"];
      const projectPath = `${answers["location"]}/${answers["artifactId"]}`;
      const needGit = answers["git"];
  
      // 下载Demo文件
      if (await downloadProject(answers)) {
        const zipFile = path.resolve(
          currentLocation,
          `${answers["artifactId"]}.zip`
        );
  
        const tarChildProcess = await execa(
          "tar",
          ["-C", savePath, "-xvzf", zipFile],
          {}
        );
        info(tarChildProcess.stdout);
        success("🎉 File decompressed successfully! 🎉");
        fs.unlinkSync(zipFile);
        if (needGit) {
          await execa("cd", [projectPath]);
          await execa("git", ["init", "."]);
          await execa("cd", [currentLocation]);
        }
      }
  
      success("\n🎉 Project created successfully,Happy coding! 🎉");
    } catch (error) {
      error(error.stack);
      process.exit(0);
    } finally {
      process.exit(0);
    }
  }
export default {
  info,
  warn,
  error,
  success,
  getJDKInfo,
  prompt,
  generateProject
};
