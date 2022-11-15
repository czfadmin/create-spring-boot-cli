import fs from "fs-extra";
import fetch from "node-fetch";
import cliProgress from "cli-progress";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import path from "path";
import utils from "./util";
import { baseMirrorChoices } from "./mirrors";
import { metadatasSavePath } from "./constants";
/**
 * 根据配置项下载Demo项目
 */
export async function downloadProject(answers: any): Promise<boolean> {
  const streamPipeline = promisify(pipeline);
  let totalLength: any = 0;
  let receivedLength = 0;
  let chunks: any[] = [];
  let savePath = path.resolve(process.cwd(), `${answers["artifactId"]}.zip`);
  const singlebar = new cliProgress.SingleBar({
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
  });
  const url = buildDownloadUrl(answers);
  let error;
  const read = async (body: NodeJS.ReadableStream) => {
    let error;
    body.on("error", (err) => {
      error = err;
    });

    for await (const chunk of body) {
      receivedLength += chunk.length;
      chunks.push(chunk);
      singlebar.update(receivedLength);
    }

    return new Promise((resolve, reject) => {
      resolve(true);
      body.on("close", () => {
        error ? reject(error) : resolve(true);
      });
    });
  };
  const response = await fetch(url);
  totalLength = response.headers.get("Content-Length");
  singlebar.start(totalLength, 0, { speed: "N/A", hideCursor: true });
  if (response.body) {
    const isOk = await read(response.body!).catch((error) =>
      utils.error(error)
    );
    if (isOk) {
      singlebar.stop();
      await streamPipeline(chunks, fs.createWriteStream(savePath));
      utils.success("\n🎉 下载成功!");
      return true;
    }
  }
  return false;
}

/**
 * 对Fetch封装
 * @param url 下载路径
 * @param method  方法
 * @param headers Header
 * @returns Promise
 */
export async function download(
  url: string,
  method: string = "GET",
  headers?: any
) {
  return fetch(url, {
    method,
    headers: {
      Accept: "application/vnd.initializr.v2.2+json",
      ...headers,
    },
  });
}

/**
 * 下载Spring boot的metadata 数据
 */
export async function downloadMetadata(): Promise<any | null> {
  try {
    const result = await Promise.all(
      baseMirrorChoices.map((mirrorChoice) => {
        return (async () => {
          const response = await download(mirrorChoice.metaClient);
          return {
            name: mirrorChoice.value,
            data: await response.json(),
          };
        })();
      })
    );
    fs.writeJsonSync(metadatasSavePath, {
      metadatas: result,
    });
    utils.success("🎉 下载成功! Path: " + metadatasSavePath);
    return {
      metadatas: result,
    };
  } catch (error) {
    utils.error("下载失败: " + error.message);
    throw error;
  }
}

// 原始包 https://start.spring.io/starter.zip?type=gradle-project&language=java&bootVersion=2.7.5&baseDir=demo&groupId=com.example&artifactId=demo&name=demo&description=Demo%20project%20for%20Spring%20Boot&packageName=com.example.demo&packaging=jar&javaVersion=17

//添加依赖 https://start.spring.io/starter.zip?type=gradle-project&language=java&bootVersion=2.7.5&baseDir=demo1&groupId=com.example&artifactId=demo&name=big&description=Demo%20project%20for%20Spring%20Boot&packageName=com.example.demo&packaging=jar&javaVersion=17&dependencies=integration,devtools

/**
 * 构建下载链接
 * 所需字段: type, language, baseDir groupId, artifactId, name , description, packageName,packagin,javaVersion, dependencies
 * @param answers 用户选择的配置
 * @returns
 */
export function buildDownloadUrl(answers: any): string {
  let mirror = baseMirrorChoices.filter((it) => it.value == answers["mirror"]);
  let baseURL = baseMirrorChoices[0].url;
  let needFields = [
    "type",
    "language",
    "groupId",
    "artifactId",
    "name",
    "description",
    "packageName",
    "packaging",
    "javaVersion",
  ];
  const baseDir = answers["artifactId"];
  if (mirror && mirror.length > 0) {
    baseURL = mirror[0].url;
  }
  let url = `${baseURL}starter.zip?`;
  for (let i = 0; i < needFields.length; i++) {
    if (i != 0) {
      url += "&";
    }
    if (answers[needFields[i]]) {
      url = `${url}${needFields[i]}=${encodeURIComponent(
        answers[needFields[i]]
      )}`;
    }
  }
  url = `${url}&baseDir=${encodeURIComponent(baseDir)}`;
  if (answers["dependencies"]) {
    url = `${url}&dependencies=${answers["dependencies"].join(",")}`;
  }
  utils.info(`🔗 下载链接: ${url}\n`);
  return url;
}

export async function getMetadataContent() {
  let metadatas: any;
  try {
    // 判断是否下载过metadata,如果存在使用缓存,反之重新下载
    if (fs.existsSync(metadatasSavePath)) {
      metadatas = fs.readJSONSync(metadatasSavePath);
      utils.success("🎉 使用缓存数据!");
    } else {
      metadatas = await downloadMetadata();
    }
    return metadatas;
  } catch (error) {
    utils.error(error.message);
    process.exit();
  }
}

export function decomposeFolder() {}
