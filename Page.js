function Page(name, doc, options) {
    this.elts = {};

    if (arguments.length == 0) { // Router style!
        return;
    }

    Page.__init_this__(doc, this, options);
}

Page.__init_this__ = function (doc, self, options) {
    doc.querySelectorAll('[id][runat=server]').forEach(function (elt) {
        self.elts[elt.getAttribute('id')] = elt;
    });

    options = options || {};
    var { html, dom } = options;
    self.window = dom.window;
    self.document = self.window.document;
    self.html = html;
    self.dom = dom;
    return options;
}


Page.prototype.registers = {};
Page.prototype.__btnClicks = {};
Page.register = function (fnName, fn) {
    this.prototype.registers = this.prototype.registers || {};
    if (typeof fnName == 'function') {
        fnName.call(this.prototype.registers);
    }
    if (!fn) {
        fn = fnName;
        fnName = fn.name;
    }
    this.prototype.registers[fnName] = fn;
}


Page.onClick = function (btnName, fn) {
    this.prototype.__btnClicks[btnName] = fn;
}

Page.prototype.init = function () { }
Page.prototype.start = function () { }
Page.prototype.end = function () { }

module.exports = Page;


require('./Page_Router');

