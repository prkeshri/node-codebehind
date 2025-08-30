import methods from "methods";
import { Router } from "express";
import { getApp } from "../index.js";

export default (Page) => {
  methods.concat("all").forEach(function (method) {
    Page[method] = function () {
      var Page = this;
      var router = (Page.__router__ = Page.__router__ || Router()); // Dynamicaly create Internal Router Instance to Use!

      var handlers = [].slice.call(arguments);
      var path;
      if (typeof handlers[0] === "string") {
        path = handlers.shift(); // Path
      }
      handlers = handlers.map(function (handler) {
        return function (req, res, next) {
          var __xo = (req.__xo = req.__xo || {});
          var page = __xo.page;
          if (!page) {
            //
            page = __xo.page = new Page({ req, res });
          }
          if(Page.view) {
            page.view(Page.view);
          }
          return handler.call(page, req, res, next);
        };
      });
      if (path) {
        handlers.unshift(path);
      }
      router[method].apply(router, handlers);
    };
  });

  function initInstance(Page, page, req, res) {
    page.req = req;
    page.res = res;
  }

  const proto = Page.prototype;
  proto.view = function (viewName, options) {
    var app = getApp();
    var options = {};
    options.__xo = {};
    options.__xo.req = this.req;
    options.__xo.res = this.res;
    options.__xo.routerStyle = true;
    options.__xo.page = this;
    app.render(viewName, options, () => {});
  };

  proto.render = function (status, status2, status3) {
    if (typeof status === "string") {
      var viewName = status;
      var options = {};
      if (typeof status2 == "object") {
        options = status2;
        status = status3;
      } else {
        status = status2;
      }
      this.view(viewName, options);
    }
    this.end();
    const html = this.document.html();
    if (typeof status === "undefined") {
      this.res.send(html);
    } else {
      this.res.send(status, html);
    }
  };
};
