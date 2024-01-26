import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

export class TextAreaType extends TypeView {
  el: TSFixme;

  static fromPort(args) {
    const view = new TextAreaType();

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
    this.el = this.bindView(this.parent.cloneTemplate('textarea'), this);
    TypeView.prototype.render.call(this);

    this.$('textarea').autosize();

    return this.el;
  }
  onPropertyChanged(scope, el) {
    const value = el.val();
    this.parent.setParameter(scope.name, value);

    // Update current value
    const current = this.getCurrentValue();
    el.val(current.value);
    this.isDefault = current.isDefault;
  }
  resetToDefault() {
    this.$('textarea').val(this.getCurrentValue().value);
  }
}
