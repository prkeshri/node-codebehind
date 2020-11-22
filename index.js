const jsdom = require("jsdom");
var jquery = require("jquery");
var path = require('path');
var fs = require('fs');
var commonScripts = fs.readFileSync('./main/common_scripts.js');

var expressApp;
var initOptions;

exports.getApp = function () {
    return expressApp;
}

exports.apply = function (app, options) {
    expressApp = app;

    var oldRender = app.render;
    initOptions = options || {};

    app.render = function render(name, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        oldRender.call(app, name, options, function (err, html) {
            if (err) {
                return callback(err, html);
            }
            __init__(name, options, html, callback);
        });
    };

    app.use(function (req, res, next) {
        var oldRender = res.render;
        res.render = function render(view, options, callback) {
            if (typeof options == 'function') {
                callback = options;
                options = {};
            } else {
                options = options || {};
            }
            options.__xo = {};
            options.__xo.req = req;
            options.__xo.res = res;
            oldRender.call(res, view, options, callback);
        }
        next();
    });

    if (options.makeRoutes) {
        makeRoutes(app, options.makeRoutes.dir || options.makeRoutes);
    }
}

var dCache = {};
function __init__(name, options, html, callback) {
    if (!options.__xo) {
        return callback(null, html);
    }
    var req = options.__xo.req;

    var dom = dCache[name],
        codebehind;
    if (!dCache[name]) {
        dom = new jsdom.JSDOM(html);
    }
    var htmlElement = dom.window.document.querySelector('html');
    if (htmlElement.getAttribute('runat') != 'server'
        || htmlElement.getAttribute('language') != 'js'
        || (!(codebehind = htmlElement.getAttribute('codebehind')))) {
        return callback(null, html);
    }
    var codebehindFile;
    if (!options.__xo.routerStyle) {
        codebehindFile = requireCodebehindFile(codebehind);
        if (!typeof codebehindFile == 'function') {
            throw new Error("Code Behind must be a function!");
        }
    }
    dom = new jsdom.JSDOM(html);
    var document = dom.window.document;

    var page;
    if (options.__xo.routerStyle) {
        page = options.__xo.page;
        page.constructor.__init_this__(document, page, { html, dom });
    } else {
        page = new codebehindFile(name, document, { html, dom });
        page.req = req;
        page.res = options.__xo.res;
    }

    var Page = page.constructor;

    Object.keys(req.query).forEach((k) => {
        var elt = document.querySelector('form[method=get] [name="' + k + '"][runat=server]');
        if (elt) elt.setAttribute('value', req.body[k]);
    });
    Object.keys(req.body).forEach((k) => {
        var elt = document.querySelector('form[method=post] [name="' + k + '"][runat=server]');
        if (elt) elt.setAttribute('value', req.body[k]);
    });
    page.init();

    var $ = jquery(dom.window);
    var hiddenI = 0, btnId = 0;
    document.querySelectorAll("[onclick][runat=server]").forEach(function (button) {
        var form = $(button).parent('form[runat=server]');
        if (!form) {
            throw new Error("Button with server click must be enclosed inside form runat server!");
        }
        var hiddenId;
        var hidden = $('input[type="hidden"][name="__eventElement"]', form)[0];
        if (!hidden) {
            hiddenId = '__eventElement' + (hiddenI++);
            form.append('<input type="hidden" name="__eventElement" id="' + hiddenId + '">');
        } else {
            hiddenId = hidden.getAttribute('id');
        }
        var onclick = button.getAttribute('onclick');

        var buttonXId = '__element_xid' + (btnId++);
        button.setAttribute('__element_xid', buttonXId);
        button.setAttribute('onclick', hiddenId + '.value=__js({event:"click", clicked:"' + buttonXId + '",exec:"' + onclick + '",id:this.id,name:this.name})');
    });
    if (commonScripts) {
        var script = document.createElement('script');
        script.innerHTML = commonScripts;
        document.body.appendChild(script);
    }
    try {
        if (req.body.__eventElement) {
            var eventData = JSON.parse(req.body.__eventElement);
            var eventSource = document.querySelector('[__element_xid="' + eventData.clicked + '"]');
            var exec = eventData.exec;

            if (page.registers[exec]) {
                page.registers[exec].call(page, eventSource, eventData);
            } else if (page.__btnClicks[eventData.clicked]) {
                page.__btnClicks[eventData.clicked].apply(page, eventSource, eventData);
            }
        } else {
            page.start();
        }
    } catch (e) {
        page.start();
    }
    if (options.__xo.routerStyle) {
        return callback(null, name, document, { html, dom });
    }
    page.end();
    html = document.documentElement.outerHTML;
    callback(null, html);
}

function requireCodebehindFile(file) {
    try {
        var fullPath = path.join(initOptions.codebehindPath, file);
        delete require.cache[require.resolve(fullPath)];
        return require(fullPath);
    } catch (e) {
        throw e;
    }
}

function makeRoutes(app, __dir, viewExtn) {
    viewExtn = viewExtn || 'pug';
    if (viewExtn[0] != '.') {
        viewExtn = '.' + viewExtn;
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


exports.Page = require('./Page');