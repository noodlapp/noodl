var _ = require('underscore'),
  View = require('../../../shared/view'),
  ImportPopupTemplate = require('../templates/importpopup.html');

// --------------------------------------------------------------
// ComponentsPanel.Folder
// --------------------------------------------------------------
var ImportPopup = function (args) {
  View.call(this);

  this.template = ImportPopupTemplate;
  for (var i in args) this[i] = args[i];

  this.hasComponents = this.imports.components !== undefined && this.imports.components.length > 0;
  this.hasResources = this.imports.resources !== undefined && this.imports.resources.length > 0;
  this.hasModules = this.imports.modules !== undefined && this.imports.modules.length > 0;
  this.hasVariants = this.imports.variants !== undefined && this.imports.variants.length > 0;
  this.hasColorStyles = this.imports.styles.colors !== undefined && this.imports.styles.colors.length > 0;
  this.hasTextStyles = this.imports.styles.text !== undefined && this.imports.styles.text.length > 0;

  if (this.initAllAsImport === true) {
    this.imports.components.forEach((c) => (c.import = true));
    this.imports.resources.forEach((c) => (c.import = true));
    this.imports.modules.forEach((c) => (c.import = true));
    this.imports.variants.forEach((c) => (c.import = true));
    this.imports.styles.colors.forEach((c) => (c.import = true));
    this.imports.styles.text.forEach((c) => (c.import = true));
  }
  this.updateDependencies();
};
ImportPopup.prototype = Object.create(View.prototype);

ImportPopup.prototype.renderItems = function (items, appendTo) {
  if (!items) return;

  var folderCache = {};
  var _this = this;
  var indent = 12,
    offset = parseInt(this.el.attr('data-indent-offset'));

  function getFolderFromCache(path) {
    if (path === '') return { el: appendTo, appendTo: appendTo };

    var f = folderCache[path];
    if (!f) {
      var comps = path.split('/');
      var f = (folderCache[path] = {
        path: path,
        items: items,
        cache: folderCache,
        localName: comps[comps.length - 1],
        open: true
      });
      f.el = _this.bindView(_this.cloneTemplate('folder'), f);
      View.$(f.el, '.indent-me').css({ left: (comps.length - 1) * indent + offset + 'px' });

      f.appendTo = f.el.find('.content');

      var parent = getFolderFromCache(comps.slice(0, comps.length - 1).join('/'));
      parent.appendTo.append(f.el);
    }
    return f;
  }

  items.sort(function (a, b) {
    return a.name > b.name ? 1 : -1;
  });

  for (var i in items) {
    var item = items[i];
    var path = item.name[0] !== '/' ? '/' + item.name : item.name; // Prepend / if missing
    var comps = path.split('/');
    item.localName = comps[comps.length - 1];
    item.folder = comps.slice(0, comps.length - 1).join('/');
    var el = this.bindView(this.cloneTemplate('item'), item);

    var f = getFolderFromCache(item.folder);
    View.$(el, '.indent-me').css({ left: (comps.length - 1) * indent + offset + 'px' });
    f.appendTo.append(el);
  }
};

ImportPopup.prototype.render = function () {
  this.el = this.bindView($(this.template), this);

  this.renderItems(this.imports.components, this.$('.components'));

  this.renderItems(this.imports.resources, this.$('.resources'));

  this.renderItems(this.imports.modules, this.$('.modules'));

  this.renderItems(this.imports.variants, this.$('.variants'));

  this.renderItems(this.imports.styles.colors, this.$('.color-styles'));

  this.renderItems(this.imports.styles.text, this.$('.text-styles'));

  return this.el;
};

ImportPopup.prototype.updateDependencies = function () {
  // Update implicit import status for components
  const components = this.imports.components;
  const resources = this.imports.resources;
  const modules = this.imports.modules;
  const variants = this.imports.variants;
  const styles = this.imports.styles;

  // First unmark all
  components.forEach((c) => (c.implicit = false));
  resources.forEach((r) => (r.implicit = false));
  modules.forEach((m) => (m.implicit = false));
  variants.forEach((v) => (v.implicit = false));
  styles.colors.forEach((c) => (c.implicit = false));
  styles.text.forEach((t) => (t.implicit = false));

  if (this.ignoreDependencies !== true) {
    function _markComponent(name) {
      components.forEach((c) => {
        if (c.name === name) {
          c.implicit = true;
          c.fileDependencies.forEach((d) => _markResource(d));
          c.dependencies.forEach((d) => _markComponent(d));
          c.styleDependencies.colors.forEach((d) => _markColorStyle(d));
          c.styleDependencies.text.forEach((d) => _markTextStyle(d));
          c.variantDependencies.forEach((d) => _markVariant(d));
        }
      });
    }

    function _markResource(name) {
      resources.forEach((r) => {
        if (r.name === name) r.implicit = true;
      });
    }

    function _markColorStyle(name) {
      styles.colors.forEach((c) => {
        if (c.name === name) c.implicit = true;
      });
    }

    function _markTextStyle(name) {
      styles.text.forEach((t) => {
        if (t.name === name) {
          t.implicit = true;
          t.fileDependencies.forEach((d) => _markResource(d));
        }
      });
    }

    function _markVariant(_v) {
      variants.forEach((v) => {
        if (v.name === _v.name && v.typename === _v.typename) {
          v.implicit = true;
          v.fileDependencies.forEach((d) => _markResource(d));
          v.styleDependencies.colors.forEach((d) => _markColorStyle(d));
          v.styleDependencies.text.forEach((d) => _markTextStyle(d));
        }
      });
    }

    components.forEach((c) => {
      c.import && _markComponent(c.name);
    });
    variants.forEach((v) => {
      v.import && _markVariant(v);
    });
    styles.text.forEach((t) => {
      t.import && _markTextStyle(t.name);
    });
  }

  function _isChecked(c) {
    return c.implicit || c.import;
  }
  components.forEach((c) => (c.check = _isChecked(c)));
  resources.forEach((c) => (c.check = _isChecked(c)));
  variants.forEach((c) => (c.check = _isChecked(c)));
  modules.forEach((c) => (c.check = _isChecked(c)));
  styles.text.forEach((c) => (c.check = _isChecked(c)));
  styles.colors.forEach((c) => (c.check = _isChecked(c)));
};

ImportPopup.prototype.onFolderClicked = function (scope) {
  scope.open = !scope.open;
  scope.appendTo.css({ display: scope.open ? 'block' : 'none' });
};

ImportPopup.prototype.onFolderBoxClicked = function (scope) {
  scope.import = !scope.import;

  // Set all items (resouces or components) in this folder to the
  // folder import status
  for (var i in scope.items) {
    var item = scope.items[i];
    var path = item.name[0] !== '/' ? '/' + item.name : item.name;
    if (path.indexOf(scope.path) === 0) item.import = scope.import;
  }

  // Same for sub folders
  for (var i in scope.cache) {
    var f = scope.cache[i];
    var path = f.path[0] !== '/' ? '/' + f.path : f.path;
    if (path.indexOf(scope.path) === 0) f.import = scope.import;
  }

  this.updateDependencies();
};

ImportPopup.prototype.onBoxClicked = function (scope) {
  scope.import = !scope.import;

  this.updateDependencies();
};

ImportPopup.prototype.onOkClicked = function () {
  this.onOk && this.onOk();
};

ImportPopup.prototype.onCancelClicked = function () {
  // Timeout for tick reasons
  setTimeout(() => {
    this.onCancel && this.onCancel();
  }, 10);
};

ImportPopup.prototype.getSelectedImports = function () {
  const components = this.imports.components;
  const resources = this.imports.resources;
  const modules = this.imports.modules;
  const variants = this.imports.variants;
  const styles = this.imports.styles;

  const imports = {
    components: components.filter((c) => c.import || c.implicit),
    resources: resources.filter((c) => c.import || c.implicit),
    modules: modules.filter((c) => c.import || c.implicit),
    variants: variants.filter((c) => c.import || c.implicit),
    styles: {
      colors: styles.colors.filter((c) => c.import || c.implicit),
      text: styles.text.filter((c) => c.import || c.implicit)
    }
  };

  return imports;
};

ImportPopup.prototype.getUnselectedImports = function (imports) {
  const components = this.imports.components;
  const resources = this.imports.resources;
  const modules = this.imports.modules;
  const variants = this.imports.variants;
  const styles = this.imports.styles;

  const unselected = {
    components: components.filter((c) => c.import === false),
    resources: resources.filter((c) => c.import === false),
    modules: modules.filter((c) => c.import === false),
    variants: variants.filter((c) => c.import === false),
    styles: {
      colors: styles.colors.filter((c) => c.import === false),
      text: styles.text.filter((c) => c.import === false)
    }
  };

  return unselected;
};

module.exports = ImportPopup;
