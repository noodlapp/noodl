import MarginPaddingView from '../marginpaddingview';
import { TypeView } from '../TypeView';

export class MarginPaddingType extends TypeView {
  defaults: TSFixme;
  values: TSFixme;
  ports: TSFixme;
  marginPaddingView: TSFixme;
  isDefault: TSFixme;
  parent: TSFixme;
  el: TSFixme;

  constructor() {
    super();
    this.defaults = {};
    this.values = {};
    this.ports = {};
  }

  static fromPort(args) {
    const p = args.port;
    const parent = args.parent;

    const toolTypeId = 'marginsandpadding-' + p.group;
    if (!parent._toolsType[toolTypeId]) {
      const view = (parent._toolsType[toolTypeId] = new MarginPaddingType());

      view.parent = parent;
      view.group = p.group;
      view.isDefault = true;

      view.addComponentPort(p);

      return view;
    } else {
      parent._toolsType[toolTypeId].addComponentPort(p);
    }
  }
  render() {
    const _this = this;

    this.marginPaddingView = new MarginPaddingView({
      values: this.values,
      defaults: this.defaults,
      isDefault: this.isDefault,
      onUpdate: (comp, value, opts) => {
        const undoArgs = {
          undo: true,
          label: 'margin or padding changed',
          oldValue: opts ? opts.oldValue : undefined
        };
        this.parent.model.setParameter(this.ports[comp].name, value, opts && opts.drag ? undefined : undoArgs);

        // Update the default value in case we are resetting
        const defaultValue = this.parent.model.getParameter(this.ports[comp].name);
        if (typeof defaultValue === 'object') {
          this.defaults[comp] = defaultValue;
        } else {
          this.defaults[comp] = { value: defaultValue, unit: this.ports[comp].type.defaultUnit };
        }
      }
    });
    this.marginPaddingView.render();

    this.el = this.marginPaddingView.el;

    return this.el;
  }
  dispose() {
    TypeView.prototype.dispose.call(this);
    this.marginPaddingView && this.marginPaddingView.dispose();
  }
  addComponentPort(p) {
    const comp = p.type.marginPaddingComp;

    this.ports[comp] = p;
    let value = this.parent.model.parameters[p.name];
    if (typeof value === 'number') value = { value: value, unit: p.type.defaultUnit };
    this.values[comp] = value;
    this.isDefault = this.isDefault && this.parent.model.parameters[p.name] === undefined;

    const defaultValue = this.parent.model.getParameter(p.name);
    if (typeof defaultValue === 'object') {
      this.defaults[comp] = defaultValue;
    } else {
      this.defaults[comp] = { value: defaultValue, unit: p.type.defaultUnit };
    }
  }
}
