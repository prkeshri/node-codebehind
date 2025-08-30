import path from "path";
import { fileURLToPath } from "url";

export const myDir = (url) => {
  const __filename = fileURLToPath(url);
  return path.dirname(__filename);
};

export function getJson(data) {
  if (typeof data === "string") {
    return JSON.parse(data);
  }
  return data;
}

export function parseSafe(args) {
  if (Array.isArray(args)) {
    return args.map(parseSafe);
  }
  try {
    return JSON.parse(args);
  } catch (e) {
    return args;
  }
}
