import { minify } from "minify";
import path from "path";

import { myDir } from "./utils.js";

const minifyOptions = {
  js: {
    type: "putout",
    putout: {
      mangle: false,
      compress: true,
    },
  },
};
export const commonScripts = await minify(
  path.join(myDir(import.meta.url), "/../client/common_scripts.js"),
  minifyOptions
);
export const commonStyles = await minify(
  path.join(myDir(import.meta.url), "/../client/common_styles.css"),
  minifyOptions
);
