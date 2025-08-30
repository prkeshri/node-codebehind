import fs from "fs";
import path from "path";
import { codebehindCache, manageCache } from "./cache.js";
import { getInitOptions } from "./expressUtil.js";

/**
 * Preloads all codebehind modules from the specified directory.
 * This function improves performance by loading and caching all codebehind files
 * at startup, reducing runtime loading delays.
 * 
 * @async
 * @function preloadCodebehindModules
 * @param {string} codebehindPath - Path to the directory containing codebehind files
 * 
 * @example
 * await preloadCodebehindModules(__dirname + '/codebehind');
 * 
 * @since 1.0.0
 */
export async function preloadCodebehindModules(codebehindPath) {
  try {
    // Check if directory exists
    if (!fs.existsSync(codebehindPath)) {
      console.warn(`Codebehind path does not exist: ${codebehindPath}`);
      return;
    }

    // Read all files in the directory
    const files = fs.readdirSync(codebehindPath);

    // Filter for .js files
    const jsFiles = files.filter((file) => file.endsWith(".js"));

    console.log(
      `Preloading ${jsFiles.length} codebehind modules from ${codebehindPath}...`
    );

    // Preload each module
    const preloadPromises = jsFiles.map(async (file) => {
      try {
        const moduleName = path.basename(file, ".js");
        const module = await requireCodebehindFile(moduleName);

        if (module.isPartial) {
          return;
        }
        // Cache the module
        codebehindCache.set(moduleName, module);
        manageCache(codebehindCache);

        console.log(`✓ Preloaded: ${moduleName}`);
        return { success: true, module: moduleName };
      } catch (error) {
        console.warn(`✗ Failed to preload ${file}: ${error.message}`);
        return { success: false, module: file, error: error.message };
      }
    });

    const results = await Promise.allSettled(preloadPromises);

    // Count successes and failures
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - successful;

    console.log(
      `Preloading complete: ${successful} successful, ${failed} failed`
    );
  } catch (error) {
    console.error(`Error during preloading: ${error.message}`);
  }
}

/**
 * Dynamically imports a codebehind file.
 * Supports ES modules and handles both local and node_modules paths.
 * 
 * @async
 * @function requireCodebehindFile
 * @param {string} file - The name of the codebehind file (without extension)
 * @returns {Promise<Function>} The imported codebehind module
 * 
 * @example
 * const HomePage = await requireCodebehindFile('Home');
 * 
 * @throws {Error} If the file cannot be found or imported
 * @since 1.0.0
 */
export async function requireCodebehindFile(file) {
    try {
      var fullPath = path.join(getInitOptions().codebehindPath, file);
      // For ES modules, we need to use dynamic import
      const module = await import(fullPath + ".js");
      return module.default || module;
    } catch (e) {
      // Try alternative path if the first one fails
      try {
        const altPath = path.join(
          process.cwd(),
          "node_modules",
          "codebehind",
          file
        );
        const module = await import(altPath + ".js");
        return module.default || module;
      } catch (altError) {
        throw e; // Throw the original error
      }
    }
  }