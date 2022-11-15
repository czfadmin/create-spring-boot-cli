#!/usr/bin/env node
import path from "path";
import inquirer from "inquirer";
import fs from "fs-extra";
import { createCommand } from "commander";
import pkg from "../package.json";
import TreePrompt from "./inquirer-tree-prompt";

import utils from "./util";
import { downloadMetadata, getMetadataContent } from "./download";
import { buildBasicQuz, addTemplateQuz } from "./question";
import { homePath, metadatasSavePath } from "./constants";
import {
  createTemplate,
  editTemplate,
  listAllTemplates,
  outputTemplatesTable,
  removeTemplate,
  saveAsTemplate,
  useTemplate,
} from "./templates";
import {
  addMirror,
  editMirror,
  listAllMirrors,
  removeMirror,
  restoreMirrors,
} from "./mirrors";
import { clearCache } from "./cache";
inquirer.registerPrompt("tree", TreePrompt);
async function generate() {
  let metadatas = await getMetadataContent();
  let quz = buildBasicQuz(metadatas["metadatas"]);
  quz.push({
    type: "confirm",
    name: "saveAsTemplate",
    message: "是否要保存模版?",
    default: false,
  });
  addTemplateQuz(quz);
  if (quz == null) {
    process.exit(-1);
  }
  const answers = await utils.prompt(quz);
  if (answers["saveAsTemplate"]) {
    saveAsTemplate(answers);
  }
  await utils.generateProject(answers);
}

async function bootstrap() {
  const program = createCommand();
  program
    .name("create-spring-boot-cli")
    .version(pkg.version, "-v, --version", "版本信息");

  program
    .command("template")
    .addHelpText("before", "用户保存模版管理")
    .option("-c,--create", "创建模版")
    .option("-r,--remove [filename]", "删除指定的模版")
    .option("-e,--edit [filename]", "编辑模版")
    .option("-l,--list", "列出之前保存的模版")
    .option("-u,--use", "选择模版创建项目")
    .action(async (options, command) => {
      let templates = listAllTemplates();
      if (options.create) {
        createTemplate(templates);
      } else if (options.list) {
        if (templates.length == 0) {
          utils.error("未保存任何模版,请创建模版");
          return;
        }
        outputTemplatesTable(templates);
      } else if (options.remove) {
        removeTemplate(templates, options.remove);
      } else if (options.edit) {
        editTemplate(templates, options.edit);
      } else if (options.use) {
        useTemplate(templates, options);
      } else {
        outputTemplatesTable(templates);
      }
    });

  program
    .command("cache")
    .addHelpText("before", "缓存管理")
    .option("-c,--clear", "清除缓存")
    .option("-d,--download", "下载镜像数据")
    .option("-u,--update", "更新缓存")
    .action(async (options, command) => {
      if (options.download) {
        utils.info("开始下载镜像数据");
        if (!fs.existsSync(path.resolve(homePath, ".csbc"))) {
          fs.mkdirSync(path.resolve(homePath, ".csbc"));
        }
        await downloadMetadata();
      }

      if (options.clear) {
        utils.info("开始清除之前下载的数据");
        clearCache(metadatasSavePath);
      }

      if (options.update) {
        utils.info("开始下载并更新数据");
        await downloadMetadata();
      }
    });

  program
    .command("mirror")
    .addHelpText("before", "镜像源管理")
    .option("-a,--add", "新增镜像源")
    .option("-e,--edit", "编辑镜像源")
    .option("-r,--remove <mirrorName>", "删除镜像源")
    .option("-l,--list", "列出所有的镜像源")
    .option("-re,--restore", "还原镜像源")
    .action((options, command) => {
      if (options.list) {
        listAllMirrors();
      }

      if (options.add) {
        addMirror();
      }

      if (options.edit) {
        editMirror();
      }

      if (options.remove) {
        const mirrors = options.remove;
        const mirrorArr = mirrors.split(",");
        removeMirror(mirrorArr);
      }
      if (options.restore) {
        restoreMirrors();
      }
    });

  //   program
  //     .command("config")
  //     .addHelpText("before", "配置CLI")
  //     .option("-l,--language [language]", "配置CLI语言")
  //     .action((options, command) => {
  //       if (options.language) {
  //         configAppLanguage(options.language);
  //       }
  //     });

  program.command("create", "创建Spring boot 项目").action(async () => {
    await generate();
  });

  if (process.argv.length > 2) {
    program.parse(process.argv);
  } else {
    await generate();
  }
}

bootstrap();
