import path from "path";
import { fileURLToPath } from "url";

/**
 * Gets the directory path from a file URL.
 * Useful for ES modules to get the current directory path.
 * 
 * @function myDir
 * @param {string} url - The import.meta.url or file URL
 * @returns {string} The directory path
 * 
 * @example
 * // In an ES module
 * const currentDir = myDir(import.meta.url);
 * console.log('Current directory:', currentDir);
 * 
 * @example
 * // Get directory of a specific file
 * const fileUrl = 'file:///path/to/file.js';
 * const dir = myDir(fileUrl);
 * 
 * @since 1.0.0
 */
export const myDir = (url) => {
  const __filename = fileURLToPath(url);
  return path.dirname(__filename);
};

/**
 * Safely parses JSON data.
 * If the input is already an object, it returns it as-is.
 * If the input is a string, it attempts to parse it as JSON.
 * 
 * @function getJson
 * @param {string|Object} data - The data to parse (string or object)
 * @returns {Object} The parsed JSON object or the original object
 * 
 * @example
 * // Parse JSON string
 * const jsonString = '{"name": "John", "age": 30}';
 * const parsed = getJson(jsonString);
 * console.log(parsed.name); // 'John'
 * 
 * @example
 * // Pass through object
 * const obj = { name: 'John', age: 30 };
 * const result = getJson(obj);
 * console.log(result === obj); // true
 * 
 * @throws {SyntaxError} If the string is not valid JSON
 * @since 1.0.0
 */
export function getJson(data) {
  if (typeof data === "string") {
    return JSON.parse(data);
  }
  return data;
}

/**
 * Safely parses JSON data with error handling.
 * Attempts to parse each item in an array or a single value.
 * Returns the original value if parsing fails.
 * 
 * @function parseSafe
 * @param {string|Array|any} args - The data to parse (string, array, or any value)
 * @returns {Object|Array|any} The parsed JSON, array of parsed values, or original value
 * 
 * @example
 * // Parse single JSON string
 * const jsonString = '{"name": "John", "age": 30}';
 * const parsed = parseSafe(jsonString);
 * console.log(parsed.name); // 'John'
 * 
 * @example
 * // Parse array of JSON strings
 * const jsonArray = ['{"id": 1}', '{"id": 2}', 'invalid json'];
 * const parsed = parseSafe(jsonArray);
 * console.log(parsed); // [{id: 1}, {id: 2}, 'invalid json']
 * 
 * @example
 * // Handle invalid JSON gracefully
 * const invalidJson = 'invalid json string';
 * const result = parseSafe(invalidJson);
 * console.log(result); // 'invalid json string' (original value returned)
 * 
 * @since 1.0.0
 */
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
