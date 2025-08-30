import { getJson } from "../utils/utils.js";
import { getApp } from "../utils/expressUtil.js";

/**
 * Base Page class for codebehind functionality.
 * Provides server-side DOM manipulation, event handling, and lifecycle management.
 * 
 * @class Page
 * @example
 * import { Page } from '@prkeshri/node-codebehind';
 * 
 * class HomePage extends Page {
 *   init() {
 *     // Initialize page elements
 *     this.elts.lblInit.html('Page initialized');
 *   }
 *   
 *   start() {
 *     // Handle page start
 *     this.elts.lbl.html('Hello World!');
 *   }
 *   
 *   btnSubmit_click(btn, eventArgs) {
 *     // Handle button click event
 *     this.elts.lbl.html('Button clicked!');
 *   }
 * }
 */
class Page {
  /**
   * Creates a new Page instance.
   * 
   * @param {Object} args - Constructor arguments
   * @param {Object} args[0] - Request and response objects
   * @param {import('express').Request} args[0].req - Express request object
   * @param {import('express').Response} args[0].res - Express response object
   * @param {import('cheerio').CheerioAPI} args[1] - Cheerio document instance
   * @param {Object} args[2] - Additional options
   */
  constructor(...args) {
    const [{ req, res }, doc, options] = args;
    this.req = req;
    this.res = res;

    if (doc) {
      Page.__init_this__(doc, this, options);
    }
  }

  /**
   * Initializes page elements and properties from the DOM.
   * 
   * @static
   * @param {import('cheerio').CheerioAPI} $ - Cheerio document instance
   * @param {Page} self - The page instance to initialize
   * @param {Object} options - Initialization options
   * @param {string} [options.html] - HTML content
   * @param {import('cheerio').CheerioAPI} [options.$] - Cheerio instance
   * @returns {Object} The options object
   */
  static __init_this__($, self, options) {
    $("[id][runat=server]").each(function () {
      const elt = $(this);
      self[elt.attr("id")] = elt;
    });

    options = options || {};
    var { html, $: $dom } = options;
    self.$ = $dom;
    self.document = $dom;
    self.html = html;
    self.dom = $dom;
    return options;
  }

  /**
   * Lifecycle method called before execution.
   * Override this method to perform pre-execution tasks.
   */
  __beforeExec() {}

  /**
   * Lifecycle method called during page initialization.
   * Override this method to initialize page elements and state.
   * 
   * @example
   * init() {
   *   this.elts.lblInit.html('Page initialized');
   *   this.elts.name.val('Default value');
   * }
   */
  init() {}

  /**
   * Lifecycle method called when the page starts.
   * Override this method to handle page start logic.
   * Automatically sets the page title if defined.
   * 
   * @example
   * start() {
   *   this.elts.lbl.html('Hello ' + this.elts.name.val() + '!');
   * }
   */
  start() {
    if (this.constructor.title) {
      this.$('title').text(this.constructor.title);
    }
  }

  /**
   * Lifecycle method called when the page ends.
   * Override this method to perform cleanup tasks.
   */
  end() {}

  /**
   * Error handler for page errors.
   * Override this method to handle page-specific errors.
   * 
   * @param {Error} e - The error that occurred
   */
  errored(e) {}

  /**
   * Sets a success result for API responses.
   * 
   * @param {*} result - The success result data
   */
  success(result) {
    this.result = { success: true, result };
  }

  /**
   * Sets a failure result for API responses.
   * 
   * @param {Error} error - The error that occurred
   */
  failure(error) {
    this.result = { success: false, error };
  }

  /**
   * Sends an error response to the client.
   * 
   * @param {Error} error - The error to send
   */
  error(error) {
    this.res.status(500).json({ error: error.message });
  }

  /**
   * Sets the page title statically.
   * 
   * @static
   * @param {string} title - The page title
   * 
   * @example
   * class HomePage extends Page {
   *   static title('Home Page');
   * }
   */
  static title(title) {
    this.title = title;
  }

  /**
   * Sets the page title dynamically.
   * 
   * @param {string} title - The page title
   * 
   * @example
   * this.title('Dynamic Title');
   */
  title(title) {
    this.$('title').text(title);
  }

  /**
   * Attaches the page to a route with automatic event handling.
   * Creates both GET and POST routes for the specified path.
   * 
   * @static
   * @param {string} path - The route path to attach to
   * 
   * @example
   * class HomePage extends Page {
   *   static attach('/home');
   *   
   *   btnSubmit_click(btn, eventArgs) {
   *     // This method will be automatically available as an API endpoint
   *     this.success('Button clicked!');
   *   }
   * }
   */
  static attach(path) {
    getApp().attach(path, async (req, res) => {
      try {
        if (req.body.__eventElement) {
          const eventData = getJson(req.body.__eventElement);
          const exec = eventData.exec;
          if (this?.prototype?.[exec]?.apiHandler) {
            const page = new this({ req, res });
            const args = eventData.args ?? [];
            let result = await page[exec](...args);
            if (result === undefined) {
              result = page.result;
              if (result.result) {
                result.result = await result.result;
              }
            }
            return res.send(result);
          }
        }

        res.render(this.view);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });
  }

  /**
   * Sets the view name for the page.
   * 
   * @static
   * @param {string} viewName - The name of the view template
   * 
   * @example
   * class HomePage extends Page {
   *   static view('home');
   * }
   */
  static view(viewName) {
    this.view = viewName;
  }
}

export default Page;
