import { Application, Request, Response } from 'express';
import { CheerioAPI } from 'cheerio';

/**
 * Configuration options for applying codebehind functionality to an Express app.
 */
export interface CodebehindOptions {
  /** Path to codebehind files directory */
  codebehindPath?: string;
  /** Whether to automatically create routes */
  makeRoutes?: boolean | {
    /** Directory for route generation */
    dir?: string;
    /** View file extension */
    viewExtn?: string;
  };
}

/**
 * Applies codebehind functionality to an Express.js application.
 * This is the main entry point for integrating codebehind capabilities.
 * 
 * @param app - The Express.js application instance
 * @param options - Configuration options for codebehind
 * @returns Promise that resolves to the configured Express app
 */
export function apply(app: Application, options?: CodebehindOptions): Promise<Application>;

/**
 * Gets the Express.js application instance that was configured with codebehind.
 * 
 * @returns The Express.js application instance
 */
export function getApp(): Application;

/**
 * Supplements a class with methods from a partial class.
 * This function is re-exported from the partial-classes dependency.
 * 
 * @param mainClass - The target class to be supplemented
 * @param partialClass - The partial class, string path, or promise
 * @returns Promise that resolves when supplementation is complete
 */
export function supplement(
  mainClass: Function, 
  partialClass: Function | string | Promise<Function>
): Promise<void>;

/**
 * Base Page class for codebehind functionality.
 * Provides the core functionality for server-side DOM manipulation and event handling.
 */
export class Page {
  /** Express request object */
  req: Request;
  /** Express response object */
  res: Response;
  /** Cheerio document instance */
  $: CheerioAPI;
  /** Alias for $ */
  document: CheerioAPI;
  /** Alias for $ */
  dom: CheerioAPI;
  /** HTML content */
  html: string;
  /** Page elements with runat="server" */
  elts: Record<string, any>;
  /** Result object for API responses */
  result?: { success: boolean; result?: any; error?: any };

  /**
   * Creates a new Page instance.
   * 
   * @param args - Constructor arguments
   */
  constructor(...args: any[]);

  /**
   * Lifecycle method called during page initialization.
   * Override this method to initialize page elements and state.
   */
  init(): void;

  /**
   * Lifecycle method called when the page starts.
   * Override this method to handle page start logic.
   */
  start(): void;

  /**
   * Lifecycle method called when the page ends.
   * Override this method to perform cleanup tasks.
   */
  end(): void;

  /**
   * Error handler for page errors.
   * Override this method to handle page-specific errors.
   * 
   * @param e - The error that occurred
   */
  errored(e: Error): void;

  /**
   * Sets a success result for API responses.
   * 
   * @param result - The success result data
   */
  success(result: any): void;

  /**
   * Sets a failure result for API responses.
   * 
   * @param error - The error that occurred
   */
  failure(error: Error): void;

  /**
   * Sends an error response to the client.
   * 
   * @param error - The error to send
   */
  error(error: Error): void;

  /**
   * Sets the page title dynamically.
   * 
   * @param title - The page title
   */
  title(title: string): void;

  /**
   * Sets the page title statically.
   * 
   * @param title - The page title
   */
  static title(title: string): void;

  /**
   * Attaches the page to a route with automatic event handling.
   * Creates both GET and POST routes for the specified path.
   * 
   * @param path - The route path to attach to
   */
  static attach(path: string): void;

  /**
   * Sets the view name for the page.
   * 
   * @param viewName - The name of the view template
   */
  static view(viewName: string): void;
}

/**
 * PartialPage class for creating partial classes that can be supplemented into main classes.
 * Uses the partial-classes dependency for method injection.
 */
export class PartialPage {
  /** Indicates this is a partial class */
  static isPartial: boolean;

  /**
   * Registers all prototype methods as API handlers.
   * This method is called automatically to mark methods for server-side event handling.
   */
  static handlers(): void;
}
