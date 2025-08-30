import path from "path";
import { __init__ } from "./transformer.js";
import { preloadCodebehindModules } from "./codebehindModules.js";

let expressApp;
let initOptions;

/**
 * Gets the Express.js application instance that was configured with codebehind.
 * 
 * @function getApp
 * @returns {import('express').Application} The Express.js application instance
 * 
 * @example
 * import { getApp } from 'codebehind';
 * 
 * const app = getApp();
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000');
 * });
 */
export function getApp() {
  return expressApp;
}

/**
 * Applies codebehind functionality to an Express.js application.
 * This is the main entry point for integrating codebehind capabilities.
 * 
 * @async
 * @function apply
 * @param {import('express').Application} app - The Express.js application instance
 * @param {Object} options - Configuration options for codebehind
 * @param {string} [options.codebehindPath] - Path to codebehind files directory
 * @param {boolean} [options.makeRoutes] - Whether to automatically create routes
 * @param {string} [options.makeRoutes.dir] - Directory for route generation
 * @param {string} [options.makeRoutes.viewExtn] - View file extension
 * @returns {Promise<import('express').Application>} The configured Express app
 * 
 * @example
 * import express from 'express';
 * import { apply } from 'codebehind';
 * 
 * const app = express();
 * app.set('view engine', 'pug');
 * 
 * await apply(app, {
 *   codebehindPath: __dirname + '/codebehind',
 *   makeRoutes: {
 *     dir: __dirname + '/views',
 *     viewExtn: '.pug'
 *   }
 * });
 * 
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000');
 * });
 */
export async function apply(app, options) {
  expressApp = app;

  var oldRender = app.render;
  initOptions = options || {};

  /**
   * Extends Express app with attach method that creates both GET and POST routes.
   * This allows pages to handle both GET requests (for rendering) and POST requests (for events).
   */
  app.attach = function (...args) {
    app.get(...args);
    app.post(...args);
  };

  /**
   * Overrides the default render method to integrate codebehind functionality.
   * Processes templates with server-side DOM manipulation and event handling.
   */
  app.render = function render(name, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    oldRender.call(app, name, options, async function (err, html) {
      if (err) {
        return callback(err, html);
      }
      try {
        await __init__(name, options, html, callback);
      } catch (error) {
        callback(error, html);
      }
    });
  };

  /**
   * Middleware that extends the response object with codebehind capabilities.
   * Adds request and response objects to the render options for page access.
   */
  app.use(function (req, res, next) {
    var oldRender = res.render;
    res.render = function render(view, options, callback) {
      if (typeof options == "function") {
        callback = options;
        options = {};
      } else {
        options = options || {};
      }
      options.__xo = {};
      Object.defineProperty(options.__xo, "req", {
        value: req,
        writable: false,
        enumerable: false,
      });
      Object.defineProperty(options.__xo, "res", {
        value: res,
        writable: false,
        enumerable: false,
      });
      oldRender.call(res, view, options, callback);
    };
    next();
  });

  // Preload all codebehind modules if codebehindPath is specified
  if (initOptions.codebehindPath) {
  await preloadCodebehindModules(initOptions.codebehindPath);
  }

  if (options.makeRoutes) {
    const __dir =
      options.makeRoutes.dir ||
      (typeof options.makeRoutes === "string"
        ? options.makeRoutes
        : app.get("views"));
    const viewExtn =
      options.makeRoutes.viewExtn || app.get("view engine") || "pug";
    makeRoutes(app, __dir, viewExtn);
  }

  return app;
}

/**
 * Creates automatic routes based on view files in a directory.
 * 
 * @param {import('express').Application} app - The Express application
 * @param {string} __dir - Directory containing view files
 * @param {string} viewExtn - View file extension
 */
function makeRoutes(app, __dir, viewExtn) {
  if (viewExtn[0] != ".") {
    viewExtn = "." + viewExtn;
  }
  app.use(function (req, res, next) {
    var p = req.path;
    var fullPath = path.join(__dir, p) + viewExtn;
    if (fs.existsSync(fullPath)) {
      res.render(fullPath);
    } else {
      next();
    }
  });
}

/**
 * Gets the initialization options that were passed to the apply function.
 * 
 * @function getInitOptions
 * @returns {Object} The initialization options object
 * 
 * @example
 * import { getInitOptions } from 'codebehind';
 * 
 * const options = getInitOptions();
 * console.log('Codebehind path:', options.codebehindPath);
 */
export function getInitOptions() {
  return initOptions;
}
