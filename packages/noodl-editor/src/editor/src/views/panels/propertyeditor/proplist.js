import View from '../../../../../shared/view';
import StringListTemplate from '../../../templates/propertyeditor/proplist.html';
import PopupLayer from '../../popuplayer';
import { ToastLayer } from '../../ToastLayer/ToastLayer';

// Styles
require('../../../styles/propertyeditor/proplist.css');

class PropList extends View {
  constructor(args) {
    super();

    this.parent = args.parent;
    this.list = args.list || [];
    this.type = args.type;
    this.plug = args.plug;
    this.title = args.title;
    this.group = args.group;
    this.isDefault = args.isDefault;
    this.onUpdate = args.onUpdate;
    this.childViews = args.childViews;
  }

  render() {
    // Component inputs will have output ports, and vice versa
    this.el = this.bindView($(StringListTemplate), this);

    this.renderItems();

    this.parent && this.parent.append(this.el);

    return this.el;
  }

  listUpdated() {
    if (this.onUpdate) {
      var updated = this.onUpdate(this.list);
      if (updated) {
        this.list = updated.value || [];
        this.isDefault = updated.isDefault;
      }
    }
    this.renderItems();
  }

  renderItems() {
    this.$('.items').html('');

    this.itemForRef = {};
    for (var i in this.list) {
      var p = this.list[i];

      var compEl = this.bindView(this.cloneTemplate('item'), {
        id: p.id,
        name: p.label,
        index: i,
        isDefault: this.isDefault
      });

      this.childViews.forEach((view) => {
        // Insert child views
        if (view.port.parentItemId === p.id) compEl.find('.props').append(view.el);
      });
      this._makeDraggable(compEl, { label: p.label, item: p });
      this._makeDroppable(compEl, p);
      this.$('.items').append(compEl);
    }
  }

  _dropOnItem(args) {
    var sourceIdx = this.list.indexOf(args.source);
    this.list.splice(sourceIdx, 1); // Remove source

    var targetIdx = this.list.indexOf(args.target);
    this.list.splice(args.below ? targetIdx + 1 : targetIdx, 0, args.source);
    this.listUpdated();
  }

  _makeDraggable(el, args) {
    var _this = this;
    var mouseDownOnItem = false;

    el.find('.drag-handle').on('mousedown', function (e) {
      mouseDownOnItem = true;
    });
    el.find('.drag-handle').on('mouseup', function (e) {
      mouseDownOnItem = false;
    });
    el.find('.drag-handle').on('mousemove', function (e) {
      if (mouseDownOnItem) {
        PopupLayer.instance.startDragging({
          label: args.label,
          item: args.item
        });
        mouseDownOnItem = false;
      }
    });
  }

  _makeDroppable(el, item) {
    el.on('mousemove', function (e) {
      if (PopupLayer.instance.isDragging()) {
        var dragItem = PopupLayer.instance.dragItem;

        if (dragItem.item === item) {
          // Can't drop on yourself
          PopupLayer.instance.indicateDropType('none');
        } else {
          var rect = el[0].getBoundingClientRect();
          var h = el.outerHeight();
          if (e.clientY - rect.top > h / 2) {
            el.find('.drop-above-indicator').first().hide();
            el.find('.drop-below-indicator').first().show();
          } else {
            el.find('.drop-above-indicator').first().show();
            el.find('.drop-below-indicator').first().hide();
          }
          PopupLayer.instance.indicateDropType('move');
        }
      }
    });
    el.on('mouseout', function (e) {
      el.find('.drop-above-indicator').first().hide();
      el.find('.drop-below-indicator').first().hide();
      PopupLayer.instance.indicateDropType('none');
    });
    el.on('mouseup', (e) => {
      var dragItem = PopupLayer.instance.dragItem;

      if (dragItem && dragItem.item !== item) {
        var rect = el[0].getBoundingClientRect();
        var h = el.outerHeight();

        this._dropOnItem({
          target: item,
          source: dragItem.item,
          below: e.clientY - rect.top > h / 2
        });

        PopupLayer.instance.dragCompleted();
      }
    });
  }

  onAddPortClicked(scope, el, evt) {
    var _this = this;

    if (this.type.autoName !== undefined) {
      var result = _this.performAdd(this.type.autoName, true);
      if (!result.success) {
        ToastLayer.showError(result.message);
      }
      evt.stopPropagation();
      return;
    }

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
  }

  _guid() {
    while (true) {
      var uid = ('0000' + ((Math.random() * Math.pow(36, 4)) | 0).toString(36)).slice(-4);
      if (this.list.find((item) => item.id === uid) === undefined) {
        return uid;
      }
    }
  }

  performAdd(name, _makeUnique) {
    if (_makeUnique) {
      // Find a unique name by adding index at the end
      let idx = 2,
        uniqueName = name + ' ' + 1;
      while (this.list.find((item) => item.label === uniqueName) !== undefined) {
        uniqueName = name + ' ' + idx;
        idx++;
      }
      name = uniqueName;
    }

    if (name === '') {
      return { success: false, message: 'Entry name cannot be empty' };
    } else if (this.list.find((item) => item.label === name) !== undefined) {
      return { success: false, message: 'Cannot create an entry with the same name as an existing one.' };
    } else {
      this.list.push({
        id: this._guid(),
        label: name
      });
      this.listUpdated();

      return { success: true };
    }
  }

  performRename(args) {
    if (args.newName === '') {
      return { success: false, message: 'Entry name cannot be empty' };
    } else if (this.list.find((item) => item.label === args.newName) !== undefined) {
      // Show alert that component cannot have same name as an
      // existing component
      return { success: false, message: 'Entry with that name already exists.' };
    } else {
      var item = this.list.find((item) => item.label === args.oldName);
      item.label = args.newName;
      this.listUpdated();

      return { success: true };
    }
  }

  onRenameClicked(scope, el, evt) {
    var _this = this;

    var header = el.parents('.header');
    header.find('.show-on-edit').show();
    header.find('.hide-on-edit').hide();

    function rename() {
      var newName = input.val();
      if (newName !== scope.name) {
        var result = _this.performRename({
          newName: newName,
          oldName: scope.name
        });

        if (!result.success) {
          ToastLayer.showError(result.message);
        }
      }

      header.find('.show-on-edit').hide();
      header.find('.hide-on-edit').show();
      input.off('blur').off('keypress'); // Make sure rename doesn't get called twice
    }

    var input = header.find('input');
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
  }

  performDelete(itemId) {
    var item = this.list.find((i) => i.id === itemId);
    if (item === undefined) return;
    var idx = this.list.indexOf(item);
    if (idx !== -1) this.list.splice(idx, 1);
    this.listUpdated();

    return { success: true };
  }

  onDeleteClicked(scope, el, evt) {
    var result = this.performDelete(scope.id);

    if (!result.success) {
      ToastLayer.showError(result.message);
    }

    evt.stopPropagation();
  }
}

export default PropList;
