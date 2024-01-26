import { NodeLibrary } from '@noodl-models/nodelibrary';

import ImagePicker from '../imagepicker';
import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

function firstType(type) {
  return NodeLibrary.nameForPortType(type);
}

export class ImageType extends TypeView {
  el: TSFixme;

  static fromPort(args) {
    const view = new ImageType();

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

    let imagePicker;
    this.$('input')
      .on('focus', function (e) {
        e.stopPropagation();
      })
      .on('click', function (e) {
        imagePicker = new ImagePicker({
          onItemSelected: function (name) {
            _this.$('input').val(name);
            _this.$('input').trigger('change');
            _this.parent.hidePopout();
            // _this.$('input').blur();
          }
        });
        //imagePicker.setFilter($(this).val());
        imagePicker.render();

        const el = $(this);
        _this.parent.showPopout({
          content: imagePicker,
          attachTo: el,
          position: 'right'
        });

        e.stopPropagation(); // Most stop propagation here otherwise the popup will close
      })
      .on('keyup', function (e) {
        imagePicker && imagePicker.setFilter($(this).val());
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
