import { apply } from "./utils/expressUtil.js";
import { getApp } from "./utils/expressUtil.js";
import { supplement } from "js-partial-classes";

// Import Page class
import PageModule from "./classes/Page.js";
import PartialPageModule from "./classes/PartialPage.js";
const Page = PageModule.default || PageModule;
const PartialPage = PartialPageModule.default || PartialPageModule;

/**
 * Applies codebehind functionality to an Express.js application.
 * This is the main entry point for integrating codebehind capabilities.
 * 
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
 * const express = require('express');
 * const { apply } = require('codebehind');
 * 
 * const app = express();
 * app.set('view engine', 'pug');
 * 
 * await apply(app, {
 *   codebehindPath: __dirname + '/codebehind'
 * });
 */
export { apply };

/**
 * Gets the Express.js application instance that was configured with codebehind.
 * 
 * @function getApp
 * @returns {import('express').Application} The Express.js application instance
 * 
 * @example
 * const { getApp } = require('codebehind');
 * const app = getApp();
 */
export { getApp };

/**
 * Supplements a class with methods from a partial class.
 * This function is re-exported from the js-partial-classes dependency.
 * 
 * @function supplement
 * @param {Function} mainClass - The target class to be supplemented
 * @param {Function|string|Promise<Function>} partialClass - The partial class, string path, or promise
 * @returns {Promise<void>} Promise that resolves when supplementation is complete
 * 
 * @example
 * import { supplement } from 'codebehind';
 * 
 * class MainClass {
 *   static {
 *     supplement(this, import('./partial-class.js'));
 *   }
 * }
 */
export { supplement };

/**
 * Base Page class for codebehind functionality.
 * Provides the core functionality for server-side DOM manipulation and event handling.
 * 
 * @class Page
 * @example
 * import { Page } from 'codebehind';
 * 
 * class HomePage extends Page {
 *   init() {
 *     // Initialize page elements
 *   }
 *   
 *   start() {
 *     // Handle page start
 *   }
 * }
 */
export { Page };

/**
 * PartialPage class for creating partial classes that can be supplemented into main classes.
 * Uses the js-partial-classes dependency for method injection.
 * 
 * @class PartialPage
 * @example
 * import { PartialPage } from 'codebehind';
 * 
 * class ValidationPartial extends PartialPage {
 *   validateEmail(email) {
 *     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 *   }
 * }
 */
export { PartialPage };
