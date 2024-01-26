import View from '../../../../../../../shared/view';
import StringListTemplate from '../../../../../templates/propertyeditor/stringlist.html';
import PopupLayer from '../../../../popuplayer';
import { ToastLayer } from '../../../../ToastLayer/ToastLayer';

var StringList = function (args) {
  View.call(this);

  this.parent = args.parent;
  this.list = args.list !== undefined && args.list !== '' ? args.list.split(',') : [];
  this.type = args.type;
  this.plug = args.plug;
  this.title = args.title;
  this.group = args.group;
  this.isDefault = args.isDefault;
  this.onUpdate = args.onUpdate;
};
StringList.prototype = Object.create(View.prototype);

StringList.prototype.render = function () {
  // Component inputs will have output ports, and vice versa
  this.el = this.bindView($(StringListTemplate), this);

  this.renderItems();

  this.parent && this.parent.append(this.el);

  return this.el;
};

StringList.prototype.listUpdated = function () {
  if (this.onUpdate) {
    var updated = this.onUpdate(this.list.join(','));
    if (updated) {
      this.list = updated.value ? updated.value.split(',') : [];
      this.isDefault = updated.isDefault;
    }
  }
  this.renderItems();
};

StringList.prototype.renderItems = function () {
  this.$('.items').html('');

  for (var i in this.list) {
    var p = this.list[i];

    var compEl = this.bindView(this.cloneTemplate('item'), { name: p, index: i, isDefault: this.isDefault });
    this.$('.items').append(compEl);
  }
};

StringList.prototype.onAddPortClicked = function (scope, el, evt) {
  var _this = this;

  var popup = new PopupLayer.StringInputPopup({
    label: 'New entry',
    okLabel: 'Add',
    cancelLabel: 'Cancel',
    onOk: function (name) {
      var result = _this.performAdd(name);
      if (!result.success) {
        ToastLayer.showError(result.message);
      }
    }
  });
  popup.render();

  PopupLayer.instance.showPopup({
    content: popup,
    attachTo: el,
    position: 'top'
  });

  evt.stopPropagation();
};

StringList.prototype.performAdd = function (name) {
  if (name === '') {
    return { success: false, message: 'Entry name cannot be empty' };
  } else if (this.list.indexOf(name) !== -1) {
    return { success: false, message: 'Cannot create an entry with the same name as an existing one.' };
  } else {
    this.list.push(name);
    this.listUpdated();

    return { success: true };
  }
};

StringList.prototype.performRename = function (args) {
  if (args.newName === '') {
    return { success: false, message: 'Entry name cannot be empty' };
  } else if (this.list.indexOf(args.newName) !== -1) {
    // Show alert that component cannot have same name as an
    // existing component
    return { success: false, message: 'Entry with that name already exists.' };
  } else {
    var idx = this.list.indexOf(args.oldName);
    this.list[idx] = args.newName;
    this.listUpdated();

    return { success: true };
  }
};

StringList.prototype.onRenameClicked = function (scope, el, evt) {
  var _this = this;

  var parent = el.parents('.component-ports-item');
  parent.find('.show-on-edit').show();
  parent.find('.hide-on-edit').hide();

  function rename() {
    var newName = input.val();
    if (newName !== scope.name) {
      var result = _this.performRename({ newName: newName, oldName: scope.name });

      if (!result.success) {
        ToastLayer.showError(result.message);
      }
    }

    parent.find('.show-on-edit').hide();
    parent.find('.hide-on-edit').show();
    input.off('blur').off('keypress'); // Make sure rename doesn't get called twice
  }

  var input = parent.find('input');
  input
    .focus()
    .off('blur')
    .on('blur', function () {
      rename();
    })
    .off('keypress')
    .on('keypress', function (e) {
      if (e.which == 13) rename();
    });

  evt.stopPropagation();
};

StringList.prototype.performDelete = function (item) {
  var idx = this.list.indexOf(item);
  if (idx !== -1) this.list.splice(idx, 1);
  this.listUpdated();

  return { success: true };
};

StringList.prototype.onDeleteClicked = function (scope, el, evt) {
  var result = this.performDelete(scope.name);

  if (!result.success) {
    ToastLayer.showError(result.message);
  }

  evt.stopPropagation();
};

export default StringList;
