import { find } from 'underscore';

import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

export class EnumType extends TypeView {
  el: TSFixme;

  static fromPort(args) {
    const view = new EnumType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.displayName = p.displayName ? p.displayName : p.name;
    view.name = p.name;
    view.type = getEditType(p);
    view.group = p.group;
    view.tooltip = p.tooltip;
    view.value = view.labelForValue(parent.model.getParameter(p.name));
    view.parent = parent;
    view.isConnected = parent.model.isPortConnected(p.name, 'target');
    view.isDefault = parent.model.parameters[p.name] === undefined;

    return view;
  }
  labelForValue(value) {
    if (value === undefined) return '';

    const e = find(this.type.enums, function (e) {
      return e === value || e.value === value;
    });
    if (e === undefined) return;

    return e.label ? e.label : e;
  }
  render() {
    const _this = this;
    this.el = this.bindView(this.parent.cloneTemplate('enum'), this);
    TypeView.prototype.render.call(this);

    this.$('.property-input-dropdown').html('');
    const enums = this.type.enums;
    for (const i in enums) {
      const value = typeof enums[i] === 'object' ? enums[i].value : enums[i];
      const label = typeof enums[i] === 'object' ? enums[i].label : enums[i];

      this.$('.property-input-dropdown').append(
        this.bindView(
          $(
            '<div class="property-input-enum" data-click="onPropertyChanged" data-value="' + value + '"></div>'
          ).text(label)
        )
      );
    }

    this.$('.property-input-dropdown').on('mousedown', function (event) {
      event.preventDefault(); // make sure drop down doesn't blur input until after "onPropertyChanged" has been triggered
    });

    this.$('input').on('blur', function () {
      _this.$('.property-input-dropdown').hide();
    });

    return this.el;
  }
  onDropDownClicked(scope, el) {
    // Close other dropdowns
    const showShould = !this.$('.property-input-dropdown').is(':visible');
    this.parent.$('.property-input-dropdown').hide();
    showShould && this.$('.property-input-dropdown').show();

    // Hide show the padding so drop downs can be scrolled to if at the bottom of the prop editor
    this.parent.$('.property-drop-down-padding').hide();
    showShould && this.parent.$('.property-drop-down-padding').show();
    this.parent.notifyListeners('panelResized');
  }
  onPropertyChanged(scope, el) {
    this.parent.setParameter(this.name, el.attr('data-value'));

    // Update current value
    const current = this.getCurrentValue();
    this.$('input').val(this.labelForValue(current.value));
    this.isDefault = current.isDefault;
  }
  resetToDefault() {
    const current = this.getCurrentValue();
    this.$('input').val(this.labelForValue(current.value));
  }
}
