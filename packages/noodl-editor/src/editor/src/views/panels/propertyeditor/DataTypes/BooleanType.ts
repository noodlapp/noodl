import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

export class BooleanType extends TypeView {
  el: TSFixme;

  static fromPort(args) {
    const view = new BooleanType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.displayName = p.displayName ? p.displayName : p.name;
    view.name = p.name;
    view.type = getEditType(p);
    view.group = p.group;
    view.tooltip = p.tooltip;
    view.value = parent.model.getParameter(p.name);
    view.parent = parent;
    view.isConnected = parent.model.isPortConnected(p.name, 'target');
    view.isDefault = parent.model.parameters[p.name] === undefined;

    return view;
  }
  render() {
    this.el = this.bindView(this.parent.cloneTemplate('boolean'), this);
    TypeView.prototype.render.call(this);

    return this.el;
  }
  onBoxClicked(scope, el) {
    this.value = !this.value;
    this.parent.setParameter(this.name, this.value);

    const current = this.getCurrentValue();
    this.isDefault = current.isDefault;
  }
  resetToDefault() {
    this.value = this.getCurrentValue().value;
  }
}
