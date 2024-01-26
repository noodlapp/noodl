import { NodeLibrary } from '@noodl-models/nodelibrary';

import FontPicker from '../fontpicker';
import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

function firstType(type) {
  return NodeLibrary.nameForPortType(type);
}

export class FontType extends TypeView {
  el: TSFixme;

  static fromPort(args) {
    const view = new FontType();

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
    this.el = this.bindView(this.parent.cloneTemplate(firstType(this.type)), this);
    TypeView.prototype.render.call(this);

    let fontPicker;
    this.$('input')
      .on('focus', (e) => {
        e.stopPropagation();
      })
      .on('click', (e) => {
        fontPicker = new FontPicker({
          onItemSelected: (name) => {
            this.$('input').val(name);
            this.$('input').trigger('change');
            this.parent.hidePopout();
          }
        });

        fontPicker.render();

        this.parent.showPopout({
          content: fontPicker,
          attachTo: this.el,
          position: 'right'
        });

        e.stopPropagation(); // Most stop propagation here otherwise the popup will close
      })
      .on('keyup', (e) => {
        fontPicker && fontPicker.setFilter(e.target.value);
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
