// Copyright (c) 2022 abchen
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import time from "esbuild-plugin-time";
import lodashTransformer from "esbuild-plugin-lodash";
import * as esbuild from "esbuild";
const isWatch = process.env.NODE_ENV == "development";

/**
 * @type {import('esbuild').BuildOptions}
 */
const esbuildConfig = {
  entryPoints: ["./src/index.ts"],
  bundle: true,
  splitting: false,
  //   outdir: "bin",
  outbase: "bin",
  outfile: "bin/index.cjs",
  watch: isWatch,
  format: "cjs", // splitting 仅在format:esm中有效
  platform: "node",
  minify: !isWatch, // 最小化
  minifyWhitespace: !isWatch,
  treeShaking: !isWatch,
  incremental: isWatch, // 增量构建
  banner: {
    js: `// Copyright (c) 2022 abchen\n//\n// This software is released under the MIT License.\n// https://opensource.org/licenses/MIT`,
    css: "red",
  },
  color: true,
  sourcemap: isWatch ? "inline" : false,
  plugins: [lodashTransformer(), time()],
};

function build() {
  esbuild.build({
    ...esbuildConfig,
    watch: isWatch,
  });
}

build();
