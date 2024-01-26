import { NodeLibrary } from '@noodl-models/nodelibrary';

import { ComponentPicker } from '../componentpicker';
import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

function firstType(type) {
  return NodeLibrary.nameForPortType(type);
}

export class ComponentType extends TypeView {
  el: TSFixme;

  static fromPort(args) {
    const view = new ComponentType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.displayName = p.displayName ? p.displayName : p.name;
    view.name = p.name;
    view.type = getEditType(p);
    view.group = p.group;
    view.value = parent.model.getParameter(p.name);
    view.parent = parent;
    view.isConnected = parent.model.isPortConnected(p.name, 'target');
    view.isDefault = parent.model.parameters[p.name] === undefined;

    return view;
  }
  render() {
    const _this = this;

    this.el = this.bindView(this.parent.cloneTemplate(firstType(this.type)), this);
    TypeView.prototype.render.call(this);

    let componentPicker;
    this.$('input')
      .on('focus', function (e) {
        e.stopPropagation();
      })
      .on('click', function (e) {
        componentPicker = new ComponentPicker({
          components: _this.type.components,
          ignoreSheetName: _this.type.ignoreSheetName,
          onItemSelected: function (name) {
            _this.$('input').val(name);
            _this.$('input').trigger('change');
            _this.parent.hidePopout();
          }
        });
        componentPicker.render(e.target);

        e.stopPropagation(); // Most stop propagation here otherwise the popup will close
      })
      .on('keyup', function (e) {
        componentPicker && componentPicker.setFilter($(this).val());
      });

    return this.el;
  }
  onPropertyChanged(scope, el) {
    this.parent.setParameter(scope.name, el.val() === '' ? undefined : el.val());

    // Update current value and if it is default or not
    const current = this.getCurrentValue();
    el.val(current.value);
    this.isDefault = current.isDefault;

    el.blur();
  }
}
