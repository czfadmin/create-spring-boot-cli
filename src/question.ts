import {
  DistinctQuestion,
  InputQuestion,
  QuestionAnswer,
  RawListQuestion,
} from "inquirer";
import { Answers } from "inquirer";
import { QuestionCollection } from "inquirer";
import { getMetadataContent } from "./download";

import { getAllMirrors } from "./mirrors";
import { listAllTemplates } from "./templates";
import { MetadataType, TemplateInfoType } from "./types";
import utils from "./util";

export const baseQuz: QuestionCollection<QuestionAnswer> = [
  {
    type: "text",
    name: "name",
    message: "项目名称",
    hint: "Name for Spring boot",
    default: "demo",
  },
  {
    type: "text",
    name: "description",
    message: "项目描述",
    default: "Description for Spring boot",
  },
  {
    type: "rawlist",
    message: "项目构建工具",
    name: "type",
    choices: [
      {
        title: "Gradle",
        value: "gradle-project",
        description: "使用Gradle构建",
      },
      {
        title: "Maven",
        value: "maven-project",
        description: "使用Maven构建",
      },
    ],
  },
  {
    type: "text",
    message: "请填写Group",
    name: "groupId",
    default: "com.example",
  },
  {
    type: "text",
    message: "请填写 Artifact",
    name: "artifactId",
    default: "demo",
  },
  {
    type: "text",
    name: "packageName",
    message: "请输入包名",
    default: (answers: Answers) => {
      return `${answers["groupId"]}.${answers["artifactId"]}`;
    },
  },
];
export const projectOptsQuz: QuestionCollection<QuestionAnswer> = [
  {
    type: "rawlist",
    name: "mirror",
    message: "请选择镜像",
    choices: () => {
      return getAllMirrors().mirrors;
    },
  },
  {
    type: "rawlist",
    message: "请选择开发语言",
    name: "language",
    choices: [],
  },
  {
    type: "rawlist",
    name: "jdk",
    message: "请选择SDK",
    choices: (answers: QuestionAnswer) => {
      const env = process.env;
      const jdkEnv = env["JAVA_HOME"];
      let jdkVer = utils.getJDKInfo();
      return [
        {
          title: `${jdkVer}`,
          value: jdkVer,
        },
      ];
    },
  },
  {
    type: "rawlist",
    message: "请选择Spring boot版本",
    name: "bootVersion",
    choices: (prev, answers, prevPrompt) => {
      return [];
    },
  },
  {
    type: "rawlist",
    name: "javaVersion",
    message: "请选择JAVA版本",
    choices: [],
  },
  {
    type: "rawlist",
    name: "packaging",
    message: "Packaging",
    choices: [],
  },
  {
    type: "text",
    message: "请输入项目地址",
    name: "location",
    default: () => {
      return process.cwd();
    },
  },
  {
    type: "confirm",
    message: "是否要创GIT",
    name: "git",
    default: false,
  },
];

/**
 * 构建 Prompt的数据
 * @param metadatas: springboot 的metadata 数据
 */
export function buildBasicQuz(metadatas?: MetadataType[]): any[] {
  if (!metadatas) {
    return [];
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
      message: "选择你要添加的依赖",
      multiple: true,
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
      validate: (value) => !!value,
    };
    return [...(baseQuz as any[]), ...newProjectQuz, depsQuz];
  }
  return [];
}

export function buildCreateTemplateQuz(
  metadatas?: MetadataType[],
  templates?: TemplateInfoType[]
) {
  let quz: any[] = [];
  let _createProjectQuz = buildBasicQuz(metadatas);
  quz = quz.concat(_createProjectQuz);
  addTemplateQuz(quz);
  return quz;
}

export async function buildEditTemplateQuz(
  templates: TemplateInfoType[],
  templateName?: string
): Promise<any[]> {
  let metadatas = await getMetadataContent();
  const basicQuz = buildBasicQuz(metadatas["metadatas"]);
  let quz: any[] = [];
  if (!templateName) {
    quz.push({
      type: "rawlist",
      name: "selectedTemplate",
      message: "选择你要编辑的模版",
      choices: () => {
        return templates.map((it) => ({
          title: it.name,
          value: it.value,
        }));
      },
    });
  }

  quz = quz.concat(
    basicQuz.map((it) => {
      return {
        ...it,
        default: (answers) => {
          const editTemplateAnswer = templates.filter((it) =>
            it.name == templateName ? templateName : answers["selectedTemplate"]
          )[0].answers;
          return editTemplateAnswer[it.name];
        },
      };
    })
  );
  addTemplateQuz(quz);
  return quz;
}
export function buildRemoveTemplateQuz(
  metadatas?: MetadataType[],
  templates?: TemplateInfoType[]
) {
  let quz: any[] = [
    {
      type: "rawlist",
      name: "selectedTemplate",
      message: "选择要删除的模版",
      choices: () => {
        return (templates || []).map((it) => ({
          title: it.name,
          value: it.value,
        }));
      },
    },
    {
      type: "confirm",
      name: "confirm",
      message: "确认删除此模版",
      default: false,
      when: (answers) => {
        return answers["selectedTemplate"];
      },
    },
  ];
  return quz;
}

export function addTemplateQuz(quz: any[], templates?: TemplateInfoType[]) {
  if (!templates || templates.length == 0) {
    templates = listAllTemplates();
  }
  quz.push({
    type: "input",
    name: "templateName",
    message: "请输入模版名称",
    validate: (value, answers) => {
      if ((templates || []).filter((it) => it.name == value).length > 0) {
        // TODO:考虑是否要替换之前的数据
        return "保存的模版中已存在相同的名字的模版数据";
      }
      if (!value) {
        return "请输入正确的模版名字";
      }
      return true;
    },
  } as InputQuestion);
}

export function buildUseTemplateQuz(templates?: any[]): any[] {
  let quz: any[] = [];
  let useTemplateQuz: RawListQuestion = {
    type: "rawlist",
    name: "selectedTemplate",
    message: "请选择一个模版",
    choices: templates,
  };
  return quz.concat(useTemplateQuz);
}
