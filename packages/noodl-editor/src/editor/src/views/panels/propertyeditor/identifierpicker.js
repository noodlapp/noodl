import _ from 'underscore';

import { ProjectModel } from '@noodl-models/projectmodel';

import View from '../../../../../shared/view';
import IdentifierPickerTemplate from '../../../templates/propertyeditor/identifierpicker.html';

var IdentifierPicker = function (args) {
  View.call(this);

  this.items = [];
  this.title = args.title;
  this.identifierType = args.identifierType;
  this.onItemSelected = args.onItemSelected;
};
IdentifierPicker.prototype = Object.create(View.prototype);

IdentifierPicker.prototype.resize = function (layout) {
  this.el.css({
    position: 'absolute',
    left: layout.x + 'px',
    top: layout.y + 'px',
    width: layout.width + 'px',
    height: layout.height + 'px'
  });
};

IdentifierPicker.prototype.renderItems = function (appendTo) {
  var _this = this;

  if (!this.el) return;

  var appendTo = this.$('.identifierItems');
  appendTo.html('');

  this.items.sort(function (a, b) {
    return a.name > b.name ? -1 : 1;
  });

  function append(item) {
    appendTo.append(item.el);
    item.el.on('click', function () {
      _this.itemClicked(item);
    });
  }

  // Render all that match filter
  var folder;
  var inNewFolder = true;
  for (var i in this.items) {
    var item = this.items[i];

    if (
      this.pathFilter === undefined ||
      this.pathFilter === '' ||
      item.name.toLowerCase().indexOf(this.pathFilter) !== -1
    ) {
      append(item);
    }
  }
};

IdentifierPicker.prototype.setFilter = function (filter) {
  this.pathFilter = filter.toLowerCase();
  this.renderItems();
};

IdentifierPicker.prototype.render = function () {
  var _this = this;

  var el = this.bindView($(IdentifierPickerTemplate), this);
  if (this.el) this.el.append(el);
  else this.el = el;

  var identifiers = {};
  ProjectModel.instance.forEachComponent(function (c) {
    c.forEachNode(function (n) {
      _.each(n.getPorts(), function (p) {
        if (typeof p.type === 'object' && p.type.name === 'string' && p.type.identifierOf === _this.identifierType) {
          var _id = n.parameters[p.name];
          if (_id !== undefined) identifiers[_id] = true;
        }
      });
    });
  });

  Object.keys(identifiers).forEach(function (_id) {
    var el = _this.bindView(_this.cloneTemplate('item'), { name: _id });
    _this.items.push({
      el: el,
      name: _id
    });
  });

  this.renderItems();

  return this.el;
};

IdentifierPicker.prototype.itemClicked = function (scope) {
  this.onItemSelected && this.onItemSelected(scope.name);
};

export default IdentifierPicker;
