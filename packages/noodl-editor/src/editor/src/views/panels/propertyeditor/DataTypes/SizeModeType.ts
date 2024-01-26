import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

export class SizeModeType extends TypeView {
  el: TSFixme;

  static fromPort(args) {
    const view = new SizeModeType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.displayName = p.displayName ? p.displayName : p.name;
    view.name = p.name;
    view.type = getEditType(p);
    view.tooltip = p.tooltip || {};
    view.group = p.group;
    view.value = parent.model.getParameter(p.name);
    view.parent = parent;
    view.isConnected = parent.model.isPortConnected(p.name, 'target');
    view.isDefault = parent.model.parameters[p.name] === undefined;

    return view;
  }

  render() {
    const _this = this;
    this.el = this.bindView(this.parent.cloneTemplate('sizemode'), this);
    TypeView.prototype.render.call(this);

    this.$('.size-icon').on('click', function () {
      const _el = this;

      const value = $(_el).attr('data-value');

      _this.parent.setParameter(_this.name, value);
      _this.value = value;
      _this.isDefault = false;

      _this.updateState();
    });

    this.updateState();

    return this.el;
  }

  updateState() {
    const _this = this;

    this.$('.size-icon').each(function () {
      const _el = this;
      const value = $(_el).attr('data-value');

      $(_el).removeClass('sel').removeClass('def');
      if (_this.value === value) {
        if (!_this.isDefault) $(_el).addClass('sel');
        else $(_el).addClass('def');
      }
    });
  }

  resetToDefault() {
    this.value = this.parent.model.getParameter(this.name);
    this.updateState();
  }
}
