import { QuestionAnswer } from "inquirer";
import { Answers } from "inquirer";
import { QuestionCollection } from "inquirer";
import { mirrorChoices } from "./constants";
import utils from "./util";

export const baseQuz: QuestionCollection<QuestionAnswer> = [
  {
    type: "text",
    name: "name",
    message: "Please input name",
    hint: "Name for Spring boot",
    default: "demo",
  },
  {
    type: "text",
    name: "description",
    message: "Please input some description",
    default: "Description for Spring boot",
  },
  {
    type: "rawlist",
    message: "选择Spring boot 构建工具",
    name: "type",
    choices: [
      {
        title: "Gradle",
        value: "gradle-project",
        description: "使用Gradle 构建Spring boot",
      },
      {
        title: "Maven",
        value: "maven-project",
        description: "使用Maven 构建Spring boot",
      },
    ],
  },
  {
    type: "text",
    message: "填写Group",
    name: "groupId",
    default: "com.example",
  },
  {
    type: "text",
    message: "填写Artifact",
    name: "artifactId",
    default: "demo",
  },
  {
    type: "text",
    name: "packageName",
    message: "Package name",
    default: (answers: Answers) => {
      return `${answers["groupId"]}.${answers["artifactId"]}`;
    },
  },
];
export const projectOptsQuz: QuestionCollection<QuestionAnswer> = [
  {
    type: "rawlist",
    name: "mirror",
    message: "Please select the mirrors",
    choices: mirrorChoices,
  },
  {
    type: "rawlist",
    message: "选择Spring boot 开发语言",
    name: "language",
    choices: [],
  },
  {
    type: "rawlist",
    name: "jdk",
    message: "Select JDK",
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
    message: "Please select the version of spring boot",
    name: "bootVersion",
    choices: (prev, answers, prevPrompt) => {
      return [];
    },
  },
  {
    type: "rawlist",
    name: "javaVersion",
    message: "Select java version",
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
    message: "Please input project location",
    name: "location",
    default: () => {
      return process.cwd();
    },
  },

  {
    type: "confirm",
    message: "Create git repository?",
    name: "git",
    default: false,
  },
];
