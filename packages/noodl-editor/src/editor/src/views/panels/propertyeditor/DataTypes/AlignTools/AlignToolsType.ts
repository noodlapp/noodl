import { TypeView } from '../../TypeView';
import AlignTools from './aligntools';

export class AlignToolsType extends TypeView {
  defaults: TSFixme;
  values: TSFixme;
  ports: TSFixme;
  alignToolsView: TSFixme;

  constructor() {
    super();
    this.defaults = {};
    this.values = {};
    this.ports = {};
  }

  static fromPort(args) {
    const p = args.port;
    const parent = args.parent;

    let toolTypeId = 'aligntools-' + p.group;
    if (
      p.type.alignComp === 'justify-content' ||
      p.type.alignComp === 'align-items' ||
      p.type.alignComp === 'align-content'
    ) {
      toolTypeId += '-' + p.type.alignComp;
    }

    if (!parent._toolsType[toolTypeId]) {
      const view = (parent._toolsType[toolTypeId] = new AlignToolsType());

      view.parent = parent;
      view.group = p.group;

      view.addComponentPort(p);

      return view;
    } else {
      parent._toolsType[toolTypeId].addComponentPort(p);
    }
  }
  render() {
    const _this = this;

    this.alignToolsView = new AlignTools({
      values: this.values,
      defaults: this.defaults,
      parent: this.parent,
      onUpdate: function (comp, value, opts) {
        const undoArgs = {
          undo: true,
          label: 'alignment changed',
          oldValue: opts ? opts.oldValue : undefined
        };
        _this.parent.model.setParameter(_this.ports[comp].name, value, undoArgs);
      }
    });
    this.alignToolsView.render();

    this.el = this.alignToolsView.el;

    return this.el;
  }
  dispose() {
    TypeView.prototype.dispose.call(this);
    this.alignToolsView.dispose();
  }
  addComponentPort(p) {
    const comp = p.type.alignComp;

    this.ports[comp] = p;
    const value = this.parent.model.parameters[p.name];
    this.values[comp] = value;
    this.defaults[comp] = p.default;
  }
}
