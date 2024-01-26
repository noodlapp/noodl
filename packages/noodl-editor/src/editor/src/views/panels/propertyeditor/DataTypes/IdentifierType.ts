import IdentifierPicker from '../identifierpicker';
import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

export class IdentifierType extends TypeView {
  el: TSFixme;
  identifierType: TSFixme;

  static fromPort(args) {
    const view = new IdentifierType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.displayName = p.displayName ? p.displayName : p.name;
    view.name = p.name;
    view.type = getEditType(p);
    view.group = p.group;
    view.identifierType = p.type.identifierOf;
    view.value = parent.model.getParameter(p.name);
    view.parent = parent;
    view.isConnected = parent.model.isPortConnected(p.name, 'target');
    view.isDefault = parent.model.parameters[p.name] === undefined;

    return view;
  }
  render() {
    const _this = this;

    this.el = this.bindView(this.parent.cloneTemplate('identifier'), this);
    TypeView.prototype.render.call(this);

    let identifierPicker;
    this.$('input')
      .on('focus', function (e) {
        e.stopPropagation();
      })
      .on('click', function (e) {
        identifierPicker = new IdentifierPicker({
          title: _this.type.identifierDisplayName || 'Identifiers',
          identifierType: _this.identifierType,
          onItemSelected: function (name) {
            _this.$('input').val(name);
            _this.$('input').trigger('change');
            _this.parent.hidePopout();
          }
        });
        identifierPicker.render();

        const el = $(this);
        _this.parent.showPopout({
          content: identifierPicker,
          attachTo: el,
          position: 'right'
        });

        e.stopPropagation(); // Most stop propagation here otherwise the popup will close
      })
      .on('keyup', function (e) {
        identifierPicker && identifierPicker.setFilter($(this).val());
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
