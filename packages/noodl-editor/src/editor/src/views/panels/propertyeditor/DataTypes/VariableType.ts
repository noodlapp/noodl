import { TypeView } from '../TypeView';
import { getEditType } from '../utils';
import { BasicType } from './BasicType';
import { BooleanType } from './BooleanType';
import { ColorType } from './ColorPicker/ColorType';

function inferType(value) {
  if (typeof value === 'string') {
    if ((value[0] === '#' && value.length === 7) || value.length === 4) return 'Co';
    if (value.startsWith('rgb(') || value.startsWith('rgba(')) return 'Co';
    return 'Ab';
  } else if (typeof value === 'boolean') {
    return 'Bo';
  } else if (typeof value === 'number') {
    return '12';
  }

  return '12';
}

export class VariableType extends TypeView {
  el: TSFixme;
  propertyType: string;
  typeView: TSFixme;

  static fromPort(args) {
    const view = new VariableType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.displayName = p.displayName ? p.displayName : p.name;
    view.name = p.name;
    view.type = getEditType(p);

    view.group = p.group;

    view.parent = parent;

    const param = parent.model.parameters[p.name];
    view.isDefault = false;
    view.propertyType = inferType(param);

    return view;
  }
  render() {
    const _this = this;
    this.el = this.bindView(this.parent.cloneTemplate('variable-type'), this);
    TypeView.prototype.render.call(this);

    // Render types dropdown
    this.$('.property-input-dropdown').html('');
    const types = this.type.types;
    for (const i in types) {
      this.$('.property-input-dropdown').append(
        this.bindView(
          $(
            '<div class="property-number-unit-enum" data-click="onTypeChanged" data-value="' +
              types[i] +
              '">' +
              types[i] +
              '</div>'
          )
        )
      );
    }

    this.$('.property-input-dropdown').on('mousedown', function (event) {
      event.preventDefault(); // make sure drop down doesn't blur input until after "onPropertyChanged" has been triggered
    });

    this.$('.property-number-units').on('blur', function () {
      _this.$('.property-input-dropdown').hide();
    });

    this.renderTypeView();

    return this.el;
  }
  renderTypeView() {
    this.$('.property-view').html('');

    const port = {
      displayName: this.port.displayName,
      name: this.port.name
    };

    if (this.propertyType === '12') {
      // @ts-expect-error
      port.type = 'number';
      this.typeView = BasicType.fromPort({ port: port, parent: this.parent });
    } else if (this.propertyType === 'Ab') {
      // @ts-expect-error
      port.type = 'string';
      this.typeView = BasicType.fromPort({ port: port, parent: this.parent });
    } else if (this.propertyType === 'Co') {
      // @ts-expect-error
      port.type = 'color';
      this.typeView = ColorType.fromPort({ port: port, parent: this.parent });
    } else if (this.propertyType === 'Bo') {
      // @ts-expect-error
      port.type = 'boolean';
      this.typeView = BooleanType.fromPort({ port: port, parent: this.parent });
    }

    this.$('.property-view').html(this.typeView.render());
  }
  onTypeDropDownClicked(scope, el) {
    const showShould = !this.$('.property-input-dropdown').is(':visible');
    this.parent.$('.property-input-dropdown').hide();
    if (showShould) {
      this.$('.property-number-units')[0].focus();
      this.$('.property-input-dropdown').show();
    }

    // Hide show the padding so drop downs can be scrolled to if at the bottom of the prop editor
    this.parent.$('.property-drop-down-padding').hide();
    showShould && this.parent.$('.property-drop-down-padding').show();
    this.parent.notifyListeners('panelResized');
  }
  onTypeChanged(scope, el) {
    const type = el.attr('data-value');
    this.$('[data-text=propertyType]').text(type);

    this.parent.setParameter(this.name, undefined);

    this.propertyType = type;
    this.renderTypeView();
  }
}
