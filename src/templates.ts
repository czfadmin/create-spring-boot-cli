import path from "path";
import fs from "fs-extra";
import Table from "cli-table3";
import utils from "./util";
import { templatesDir } from "./constants";
import { TemplateInfoType } from "./types";
import { getMetadataContent } from "./download";
import {
  buildCreateTemplateQuz,
  buildEditTemplateQuz,
  buildRemoveTemplateQuz,
} from "./question";

function getTemplateFileInfos(files: any[]): any[] {
  let content;
  let infos: {
    name: string;
    answers: any;
    createdDate: string;
  }[] = [];

  const getFileInfo = (filename: string) => {
    const a = filename.split(".")[0].split("_");
    return {
      name: a[0],
      value: filename,
      createdDate: a[1],
    };
  };
  for (let tempFile of files) {
    // 排除MacOS中的.DS_Store
    if (tempFile == ".DS_Store") {
      continue;
    }
    content = fs.readJSONSync(path.resolve(templatesDir, tempFile));
    infos.push({
      ...getFileInfo(tempFile),
      answers: content,
    });
  }

  return infos;
}
export function listAllTemplates(): TemplateInfoType[] {
  if (fs.existsSync(templatesDir)) {
    const templateFiles = fs.readdirSync(templatesDir);
    if (templateFiles.length != 0) {
      const infos = getTemplateFileInfos(templateFiles);
      return infos;
    }
  } else {
    utils.info("暂无模版数据");
  }
  return [];
}

export function saveAsTemplate(answers: any, templateName?: string) {
  if (!templateName) {
    utils.error("保存的模版名称不可为空");
    process.exit(1);
  }
  const name = `${answers["templateName"]}_${Date.now()}.json`;
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir);
  }
  const savePath = path.resolve(templatesDir, name);
  const { toCreateTemplate, ...rest } = answers;
  fs.writeJSONSync(savePath, rest);
  utils.success("💐 模版保存成功.路径: " + savePath);
}

export function outputTemplatesTable(data: TemplateInfoType[]) {
  const head = ["Template", "Name", "Dependencies"];
  const table = new Table({
    head,
    colAligns: ["left"],
    rowAligns: ["center"],
    colWidths: [40, 40, 40],
    wordWrap: true,
    wrapOnWordBoundary: false,
  });
  data.map((it) => {
    table.push([
      it.value,
      it.name,
      (it.answers["dependencies"] || []).join(","),
    ]);
  });
  try {
    console.log(table.toString());
  } catch (error) {
    console.log(error);
  }
}

export async function createTemplate(templates: TemplateInfoType[]) {
  let metadatas = await getMetadataContent();
  const quz = buildCreateTemplateQuz(metadatas["metadatas"], templates);
  const answers = await utils.prompt(quz);
  const {
    selectedTemplate,
    location,
    templateName: tempName,
    ...rest
  } = answers;
  saveAsTemplate(rest, tempName);
  outputUpdateTemplate(answers);
}

export async function editTemplate(
  templates: TemplateInfoType[],
  templateName: string | boolean
) {
  let answers: any;
  let quz: any[] = [];
  let editTemplate = templates.filter((it) => it.name === templateName)[0];
  if (templates.length == 0) {
    utils.error("无保存的模版,操作取消");
    return;
  }
  if (typeof templateName == "boolean") {
    quz = await buildEditTemplateQuz(templates);
  } else {
    if (!editTemplate) {
      utils.error(
        `编辑模版 ${templateName}失败: 不存在名字为${templateName}模版`
      );
      process.exit(-1);
    } else {
      quz = await buildEditTemplateQuz(templates, templateName);
    }
  }
  answers = await utils.prompt(quz);
  const {
    selectedTemplate,
    location,
    templateName: tempName,
    ...rest
  } = answers;
  if (editTemplate) {
    fs.unlinkSync(path.resolve(templatesDir, editTemplate.value));
  }
  saveAsTemplate(rest, tempName);
  outputUpdateTemplate(answers);
  utils.success("编辑模版成功");
}

function outputUpdateTemplate(answers: any) {
  const newTemplates = listAllTemplates();
  const head = ["File Path", "Name", "Dependencies"];
  const table = new Table({
    head,
    colAligns: ["left"],
    rowAligns: ["center"],
    colWidths: [40, 40, 40],
    wordWrap: true,
    wrapOnWordBoundary: false,
  });
  table.push([
    newTemplates.filter((it) => it.name == answers["templateName"])[0].value,
    answers["templateName"],
    answers["dependencies"].join(","),
  ]);
  try {
    console.log(table.toString());
  } catch (error) {
    console.log(error);
  }
}
export async function removeTemplate(
  templates: TemplateInfoType[],
  delTempName?: string
) {
  let answers = [];
  if (typeof delTempName == "string" && delTempName) {
    if (templates.filter((it) => it.name === delTempName).length == 0) {
      utils.error(
        `删除模版 ${delTempName}失败: 不存在名字为${delTempName}模版`
      );
      process.exit(-1);
    } else {
      answers = await utils.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `(${delTempName})确认删除此模版吗?`,
          default: false,
        },
      ]);
    }
  } else {
    let metadatas = await getMetadataContent();
    const quz = buildRemoveTemplateQuz(metadatas["metadatas"], templates);
    answers = await utils.prompt(quz);
  }

  if (answers["confirm"]) {
    let delPath = "";
    if (typeof delTempName == "boolean") {
      const delTemplate = answers["selectedTemplate"];
      delPath = path.resolve(templatesDir, delTemplate);
    } else {
      delPath = path.resolve(
        templatesDir,
        templates.filter((it) => it.name == delTempName)[0].value
      );
    }
    if (!delPath) {
      utils.error("删除指定的模版成功!");
      return;
    }
    fs.unlinkSync(delPath);
    utils.success(`删除指定的模版成功`);
  }
}

export async function useTemplate(templates: TemplateInfoType[], options: any) {
  if (templates.length == 0) {
    utils.info("暂时为创建模版,请先使用csbc template -c 创建模版");
    process.exit(0);
  } else {
    const templateName = options.use;
    utils.info(`正在使用模版${templateName}创建`);
    let selectedTemplates = templates.filter((it) => it.name === templateName);
    if (selectedTemplates.length == 0) {
      utils.error(`使用模版失败.无[${templateName}]文件`);
      process.exit(0);
    }
    let answers = selectedTemplates[0].answers;
    await utils.generateProject(answers);
  }
}
