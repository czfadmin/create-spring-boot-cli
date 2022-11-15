import { Question, QuestionAnswer, RawListQuestion } from "inquirer";
import fs from "fs-extra";
import Table from "cli-table3";
import utils from "./util";
import { mirrorsPath } from "./constants";
import { downloadMetadata, getMetadataContent } from "./download";

export const baseMirrorChoices = [
  {
    title: "Offical",
    value: "Offical",
    url: "https://start.spring.io/",
    metaClient: "https://start.spring.io/metadata/client", // 里面包含所有配置选项和依赖
  },
  {
    title: "Ali",
    value: "阿里",
    url: "https://start.aliyun.com/",
    metaClient: "https://start.aliyun.com/metadata/client", // 阿里云提供的数据
  },
];

export function buildMirrorQuz() {
  let existMirrors = getAllMirrors().mirrors;
  let quz: Question[] = [
    {
      type: "input",
      name: "name",
      message: "输入镜像名称",
      validate: (input, answers) => {
        if (existMirrors.filter((it) => it.name == input).length > 0) {
          return "镜像列表中已经存在相同名称的镜像,请重新输入";
        }
        if (!input) {
          return "请输入争取的镜像名称";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "url",
      message: "输入镜像地址",
    },
  ];

  return quz;
}

export function getAllMirrors() {
  if (!fs.existsSync(mirrorsPath)) {
    fs.writeJSONSync(mirrorsPath, {
      mirrors: baseMirrorChoices,
    });
    return {
      mirrors: baseMirrorChoices,
    };
  }
  return fs.readJsonSync(mirrorsPath);
}

export async function saveMirrors(mirrors: any) {
  fs.writeJSONSync(mirrorsPath, {
    mirrors,
  });
}

export async function updateMetadata() {
  try {
    utils.info("开始下载数据");
    getMetadataContent();
  } catch (error) {
    utils.error("更新数据源失败:" + error.message);
    process.exit(-1);
  }
}
export async function addMirror() {
  const quz = buildMirrorQuz();
  const existMirrors = getAllMirrors().mirrors;
  const answers = await utils.prompt(quz);
  const mirror = {
    title: answers["name"],
    value: answers["name"],
    url: answers["url"],
    metaClient: `${answers["url"]}/metadata/client`,
  };
  existMirrors.push(mirror);
  await updateMetadata();
  saveMirrors(existMirrors);
  utils.success("🎆 新增镜像成功");
}

export async function listAllMirrors() {
  let existMirrors = getAllMirrors().mirrors;
  const head = ["Name", "Url", "Meta Client"];
  const table = new Table({
    head,
    colAligns: ["center"],
    rowAligns: ["center"],
    colWidths: [20, 40, 60],
    wordWrap: true,
    wrapOnWordBoundary: false,
  });
  existMirrors.map((it) => {
    table.push([it.title, it.url, it.metaClient]);
  });
  try {
    console.log(table.toString());
  } catch (error) {
    console.log(error);
  }
}

export async function editMirror() {
  let existMirrors = getAllMirrors().mirrors;
  const quz: Question[] = [
    {
      type: "rawlist",
      name: "selectedMirror",
      message: "选择需要编辑的镜像",
      choices: existMirrors,
    } as RawListQuestion,
    {
      type: "input",
      name: "name",
      message: "输入镜像名称",
      validate: (input, answers) => {
        if (existMirrors.filter((it) => it.title == input)) {
          return "镜像列表中已经存在相同名称的镜像,请重新输入";
        }
        if (!input) {
          return "请输入争取的镜像名称";
        }
        return true;
      },
      default: (answers) => {
        const mirror = existMirrors.filter(
          (it) => it.title == answers["selectedMirror"]
        )[0];
        return mirror.title;
      },
    },
    {
      type: "input",
      name: "url",
      message: "输入镜像地址",
      default: (answers) => {
        const mirror = existMirrors.filter(
          (it) => it.title == answers["selectedMirror"]
        )[0];
        return mirror.url;
      },
    },
    {
      type: "confirm",
      name: "save",
      message: "是否要保存",
      default: false,
    },
  ];
  const answers = await utils.prompt(quz);
  if (!answers["save"]) {
    utils.info("用户取消保存");
    return;
  }

  const mirror = {
    title: answers["name"],
    value: answers["name"],
    url: answers["url"],
    metaClient: `${answers["url"]}/metadata/client`,
  };
  existMirrors = existMirrors.filter(
    (it) => it.title != answers["selectedMirror"]
  );
  await updateMetadata();
  existMirrors.push(mirror);
  saveMirrors(existMirrors);
}

export async function removeMirror(name: String[]) {
  let existMirrors = getAllMirrors().mirrors as any[];
  if (existMirrors.length == 2) {
    utils.warn("镜像源最少两个");
  }
  try {
    name.forEach((it) => {
      if (existMirrors.map((it) => it.title).indexOf(it) == -1) {
        throw new Error("不存在此镜像配置");
      }
    });
    name.forEach((it) => {
      existMirrors = existMirrors.filter((item) => item.title != it);
    });
    await updateMetadata();
    saveMirrors(existMirrors);
  } catch (error) {
    utils.error("删除镜像源失败");
  }
}

export async function restoreMirrors() {
  utils.info("开始还原镜像源");
  saveMirrors(baseMirrorChoices);
  await updateMetadata();
  utils.success("还原镜像源成功");
}
