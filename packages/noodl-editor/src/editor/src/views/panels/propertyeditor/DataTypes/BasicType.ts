import { NodeLibrary } from '@noodl-models/nodelibrary';

import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

function firstType(type) {
  return NodeLibrary.nameForPortType(type);
}

export class BasicType extends TypeView {
  el: TSFixme;
  static fromPort(args) {
    const view = new BasicType();

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
    this.el = this.bindView(this.parent.cloneTemplate(firstType(this.type)), this);
    TypeView.prototype.render.call(this);

    return this.el;
  }
  onPropertyChanged(scope, el) {
    if (firstType(scope.type) === 'number') {
      const value = parseFloat(el.val());
      this.parent.setParameter(scope.name, isNaN(value) ? undefined : value);
    } else {
      this.parent.setParameter(scope.name, el.val());
    }

    // Update current value and if it is default or not
    const current = this.getCurrentValue();
    el.val(current.value);
    this.isDefault = current.isDefault;

    el.blur();
  }
}
