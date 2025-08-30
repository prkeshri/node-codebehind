import * as cheerio from "cheerio";
import { getJson } from "./utils.js";
import { iterateDescriptors } from "js-partial-classes";
import { templateCache, manageCache, codebehindCache } from "./cache.js";
import { requireCodebehindFile } from "./codebehindModules.js";
import { commonScripts, commonStyles } from "./commons.js";

/**
 * Main transformation function that processes HTML templates with codebehind functionality.
 * This function is the core of the codebehind system, handling template caching, DOM manipulation,
 * event binding, and codebehind execution.
 * 
 * @async
 * @function __init__
 * @param {string} name - The name of the template/view
 * @param {Object} options - Render options including request/response objects
 * @param {Object} options.__xo - Extended options containing request and response
 * @param {import('express').Request} options.__xo.req - Express request object
 * @param {import('express').Response} options.__xo.res - Express response object
 * @param {string} html - The HTML content to process
 * @param {Function} callback - Callback function to return the processed HTML
 * 
 * @example
 * // This function is called internally by the Express render override
 * await __init__('home', { __xo: { req, res } }, htmlContent, (err, result) => {
 *   if (err) {
 *     // Handle error
 *   } else {
 *     // Send processed HTML
 *     res.send(result);
 *   }
 * });
 * 
 * @throws {Error} If codebehind file is not a function
 * @since 1.0.0
 */
export async function __init__(name, options, html, callback) {
  if (!options.__xo) {
    return callback(null, html);
  }
  var req = options.__xo.req;

  // Check if this is a codebehind page
  let $;
  let htmlElement;

  // Use cached template if available
  if (templateCache.has(name)) {
    const cachedHtml = templateCache.get(name);
    // Load from cached HTML - this is still much faster than parsing from scratch
    // and avoids the complexity of trying to clone Cheerio instances
    $ = cheerio.load(cachedHtml);
    htmlElement = $("html");
  } else {
    $ = cheerio.load(html);
    htmlElement = $("html");

    // Cache the HTML string for future use
    templateCache.set(name, html);
    manageCache(templateCache);
  }

  if (htmlElement.attr("runat") !== "server" ||
    htmlElement.attr("language") !== "js" ||
    !htmlElement.attr("codebehind")) {
    return callback(null, html);
  }

  const codebehindName = htmlElement.attr("codebehind");

  htmlElement.removeAttr("codebehind");
  htmlElement.removeAttr("language");
  htmlElement.removeAttr("runat");

  // Get or create cached codebehind
  let codebehindFile = codebehindCache.get(codebehindName);
  if (!codebehindFile) {
    codebehindFile = await requireCodebehindFile(codebehindName);
    codebehindCache.set(codebehindName, codebehindFile);
    manageCache(codebehindCache);
  }

  if (typeof codebehindFile !== "function") {
    throw new Error("Code Behind must be a function!");
  }

  // Create page instance
  let page;
  if (options.__xo.page) {
    page = options.__xo.page;
    page.constructor.__init_this__($, page, { html, $ });
  } else {
    page = new codebehindFile({ req, res: options.__xo.res }, $, { html, $ });
  }

  // Populate form data
  Object.keys(req.query).forEach((k) => {
    const elt = $(`[name="${k}"][runat=server]`);
    if (elt.length) {
      elt.attr("value", req.query[k]);
    }
  });

  Object.keys(req.body || {}).forEach((k) => {
    const elt = $(`[name="${k}"][runat=server]`);
    if (elt.length) {
      elt.attr("value", req.body[k]);
    }
  });

  page.init();

  // Handle server-side events
  let hiddenI = 0, btnId = 0;

  const clientEvents = {};
  const serverEvents = {};

  iterateDescriptors(page.constructor.prototype, ([key, value]) => {
    if (value.value.apiHandler) {
      serverEvents[key] =
        serverEvents[key] ??
        `(...args) => { return server_event("${key}", args); }`;
    }
  });
  const initEvents = [];
  $("[onclick][runat=server]").each(function () {
    const button = $(this);

    const buttonXId = "__element_xid" + btnId++;

    button.attr("__element_xid", buttonXId);

    // Check if button is inside an UpdatePanel
    const { updatePanel, updatePanelId } = getUpdatePanelFor({ button, $ });
    const form = button.closest("form[runat=server]");

    if (!updatePanelId && !form.length) {
      throw new Error(
        "Button with server click must be enclosed inside form or updatepanel runat server!"
      );
    }

    const upOrForm = updatePanelId ? updatePanel : form;
    const hiddenId = addHidden(upOrForm, () => hiddenI++);
    const clickJs = {
      event: "click",
      clicked: buttonXId,
      id: button.attr("id"),
      name: button.attr("name"),
      updatePanel: updatePanelId,
    };
    let clickValTemplate = `${hiddenId}.value=__js(___JS_OBJECT___);`;
    let clickPre = "";
    if (updatePanelId) {
      clickJs.updatePanel = updatePanelId;
      clickValTemplate += `__updatePanel("${hiddenId}", self);`;
      clickPre = "event.preventDefault();";
    }
    const onclick = button.attr("onclick");
    let eventI = 0;
    let clickHandler = getModifiedOnClick(onclick, (serverEvent, eventArgs) => {
      const clickJsNow = {
        ...clickJs,
        exec: serverEvent,
      };
      let clickNowStr = JSON.stringify(clickJsNow);
      clickNowStr =
        clickNowStr.substring(0, clickNowStr.length - 1) +
        ", args: [" +
        eventArgs +
        "]}";
      const clickVal = clickValTemplate.replace("___JS_OBJECT___", clickNowStr);
      const key = `${buttonXId}_${eventI++}`;
      clientEvents[key] = `function(self, event) { ${clickPre} ${clickVal} }`;
      serverEvents[serverEvent] =
        serverEvents[serverEvent] ??
        `(...args) => { return server_event("${serverEvent}", args); }`;
      const ret = `raiseServerEvent(this, "${key}", event)`;
      return ret;
    });

    const initEventsElt = [
      `{ const elt = document.querySelector("[__element_xid=\'${buttonXId}\']");`,
    ];
    initEventsElt.push(
      `elt.addEventListener("click", function (event) {${clickHandler}});`
    );
    button.removeAttr("onclick");

    const postclick = button.attr("postclick");
    if (postclick) {
      initEventsElt.push(` elt.postclick = ${postclick}; `);
      button.removeAttr("postclick");
    }
    initEventsElt.push(`}`);
    initEvents.push(initEventsElt.join("\t"));
  });

  // Add common scripts
  const scripts = ["const serverEvents = {}; const clientEvents = {};"];

  const initScript = [];
  Object.entries(serverEvents).forEach(([key, value]) => {
    initScript.push(`serverEvents["${key}"] = ${value};`);
  });
  Object.entries(clientEvents).forEach(([key, value]) => {
    initScript.push(`clientEvents["${key}"] = ${value};`);
  });
  if (initEvents.length) {
    initScript.push(initEvents.join("\n"));
  }

  scripts.push(`(function() {${initScript.join("\n")}})();`);
  if (commonScripts) {
    scripts.push(commonScripts);
  }
  $("body").append(`<script>${scripts.join("\n")}</script>`);

  if (commonStyles) {
    $("head").append(`<style>${commonStyles}</style>`);
  }
  let updatePanelId;
  try {
    if (req.body.__eventElement) {
      const eventData = getJson(req.body.__eventElement);
      updatePanelId = eventData.updatePanel;
      const eventSource = $(`[__element_xid="${eventData.clicked}"]`);
      const exec = eventData.exec;

      if (exec) {
        const pageExec = page[exec];
        if (pageExec) {
          const event = {
            source: eventSource,
            target: eventSource,
            info: eventData,
          };
          const args = eventData.args ?? [];
          await page.__beforeExec?.({ handler: pageExec, event, args });
          await pageExec.call(page, event, ...args);
        } else {
          throw new Error(`Function ${exec} not found in codebehind!`);
        }
      }
    } else {
      page.start();
    }
  } catch (e) {
    page.errored(e);
    return callback(e, "Error!");
  }

  if (options.__xo.routerStyle) {
    return callback(null, name, $, { html, $ });
  }

  let resp;
  if (updatePanelId) {
    // Find the UpdatePanel
    const updatePanel = $(`#${updatePanelId}[updatepanel="true"]`);
    if (updatePanel.length) {
      updatePanel.find("[runat=server]").each(function () {
        const elt = $(this);
        elt.removeAttr("runat");
      });
      // Return only the UpdatePanel HTML
      resp = {
        success: true,
        html: updatePanel.html(),
        panelId: updatePanelId,
      };
    } else {
      resp = {
        success: false,
        error: "UpdatePanel not found",
      };
    }
  } else {
    page.end();
    $("[runat=server]").each(function () {
      const elt = $(this);
      elt.removeAttr("runat");
    });
    resp = $.html();
  }

  callback(null, resp);
}


function addHidden(form, getHiddenId) {
  let hidden = form.find('input[type="hidden"][name="__eventElement"]');
  let hiddenId;
  if (!hidden.length) {
    hiddenId = "__eventElement" + getHiddenId();
    form.append(`<input type="hidden" name="__eventElement" id="${hiddenId}">`);
  } else {
    hiddenId = hidden.attr("id");
  }
  return hiddenId;
}


export function getModifiedOnClick(onclick, clickModifier) {
  const regex = /server\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g;

  const matches = [...onclick.matchAll(regex)];

  let parts = [];
  let lastIndex = 0;

  for (const match of matches) {
    const [serverDotMethodCall, methodName, methodArgs] = match;
    const matchStart = match.index;
    const matchEnd = match.index + serverDotMethodCall.length;

    // Push the non-matching text before the match
    parts.push(onclick.slice(lastIndex, matchStart));

    // Push the replacement for the matched segment
    parts.push(clickModifier(methodName, methodArgs));

    // Update the last index to the end of this match
    lastIndex = matchEnd;
  }

  // Add the remaining part of the code after the last match
  parts.push(onclick.slice(lastIndex));

  // Join everything back into a single string
  const modifiedOnClick = parts.join("");
  return modifiedOnClick;
}


export function getUpdatePanelFor({ button, $ }) {
  let updatePanel = button.closest('[updatepanel="true"]');
  let updatePanelId;
  if (updatePanel.length) {
    updatePanelId = updatePanel.attr("id");
  } else {
    const forAttr = button.attr("for");
    if (forAttr) {
      updatePanelId = forAttr;
      updatePanel = $(`#${forAttr}[updatepanel="true"]`);
    }
    if (!updatePanel.length) {
      let forAttr = button.closest("[for]").attr("for");
      if (forAttr) {
        updatePanelId = forAttr;
        updatePanel = $(`#${forAttr}[updatepanel="true"]`);
      }
    }
  }
  return { updatePanel, updatePanelId };
}