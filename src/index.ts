#!/usr/bin/env node
import path from "path";
import inquirer, { Answers, DistinctQuestion } from "inquirer";
import fs from "fs-extra";
import { execa } from "execa";
import TreePrompt from "./inquirer-tree-prompt";
import utils, { outputTable } from "./util";
import { downloadMetadata, downloadProject } from "./download";
import { projectOptsQuz, baseQuz } from "./question";

type MetadataType = { name: string; data: any };

/**
 * 构建 Prompt的数据
 * @param metadatas: springboot 的metadata 数据
 */
function buildPromptObjects(metadatas?: MetadataType[]): any[] | null {
  if (!metadatas) {
    return null;
  }
  // 调整对应的Quz
  const adjustQuzByQuzName = (name: string, answers: any[]) => {
    if (metadatas.length > 0) {
      let metadata: any = metadatas.filter(
        (it: any) => it.name == answers["mirror"]
      );
      if (!metadata) {
        metadata = metadatas[0][0].data || [];
      } else {
        metadata = metadata[0].data;
      }
      let metaVersion = metadata[name];
      //   let defaultSelected = metaVersion["default"];
      return (metaVersion["values"] as any[]).map((item: any) => ({
        title: item.name,
        value: item.id,
      }));
    }
    return [];
  };

  if (metadatas instanceof Array) {
    // 调整 projectQuz
    let newProjectQuz = (projectOptsQuz as ReadonlyArray<DistinctQuestion>).map(
      (quz: any) => {
        // 待调整的Quz
        let toAdjustQuz = [
          "bootVersion",
          "javaVersion",
          "language",
          "packaging",
        ];
        if (toAdjustQuz.includes(quz.name as string)) {
          return {
            ...quz,
            choices: (answers) => {
              return adjustQuzByQuzName(quz.name as string, answers);
            },
          };
        }
        return quz;
      }
    );

    let depsQuz: any = {
      type: "tree",
      name: "dependencies",
      message: "Select the dependency you want to add",
      multiple: true,
      validate: (value) => !!value,
      tree: (answers: Answers) => {
        let metadata: any = metadatas.filter(
          (it: any) => it.name == answers["mirror"]
        );
        if (!metadata) {
          metadata = metadatas[0][0].data || [];
        } else {
          metadata = metadata[0].data;
        }
        let dependencies = metadata["dependencies"] as {
          type: string;
          values: any[];
        };
        if (!dependencies || dependencies.values.length < 0) {
          return [];
        }
        let choices = dependencies.values.map((item) => ({
          value: "",
          name: item.name,
          children: item.values.map((it) => ({
            name: it.name,
            value: it.id,
          })),
        }));
        return choices;
      },
    };

    return [...(baseQuz as any[]), ...newProjectQuz, depsQuz];
  }
  return null;
}

async function bootstrap() {
  // 下载METEDATA
  let metadatas;
  try {
    // 可能会出现超时现象
    const homePath = process.env["HOME"] || `/Users/${process.env["USER"]}`;
    const metadatasSavePath = path.resolve(homePath, ".metadatas.json");
    metadatas = await downloadMetadata(metadatasSavePath);
  } catch (error) {
    console.error(error.message);
  }

  try {
    const quz = buildPromptObjects(metadatas["metadatas"]);
    if (quz == null) {
      process.exit(-1);
    }
    inquirer.registerPrompt("tree", TreePrompt);
    const answers = await inquirer.prompt(quz).catch((err) => {
      utils.error(err.message);
      process.exit(-1);
    });

    outputTable(answers);
    const currentLocation = process.cwd();
    const projectPath = answers["location"];
    const needGit = answers["git"];

    // 下载Demo文件
    if (await downloadProject(answers)) {
      const zipFile = path.resolve(
        currentLocation,
        `${answers["artifactId"]}.zip`
      );

      const tarChildProcess = await execa(
        "tar",
        ["-C", projectPath, "-xvzf", zipFile],
        {}
      );
      utils.info(tarChildProcess.stdout);
      utils.success("🎉 File decompressed successfully! 🎉");
      fs.unlinkSync(zipFile);
      if (projectPath === currentLocation) {
        if (needGit) {
          await execa("git", ["init", "."]);
        }
      } else {
        if (!fs.existsSync(projectPath)) {
          fs.mkdirSync(projectPath);
        }
        await execa("cd", [projectPath]);
        if (needGit) {
          await execa("git", ["init", "."]);
        }
      }
    }

    utils.success("\n🎉 Project created successfully,Happy coding! 🎉");
  } catch (error) {
    utils.error(error.stack);
    process.exit(0);
  } finally {
    process.exit(0);
  }
}

bootstrap();
