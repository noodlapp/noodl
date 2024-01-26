import ResizingView from '../resizingview';
import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

export class ResizingType extends TypeView {
  values: TSFixme;
  resizingView: TSFixme;

  static fromPort(args) {
    const view = new ResizingType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.name = p.name;
    view.type = getEditType(p);

    view.group = p.group;

    view.parent = parent;

    view.values = parent.model.parameters[p.name];

    view.resizingView = new ResizingView({
      modes: p.type.modes,
      values: view.values,
      defaults: p.default || p.type.defaults,
      widthUnits: p.type.widthUnits || p.type.units,
      heightUnits: p.type.heightUnits || p.type.units,
      onUpdate: function (value, opts) {
        const undoArgs = {
          undo: true,
          label: 'resizing changed',
          oldValue: opts ? opts.oldValue : undefined
        };
        parent.model.setParameter(p.name, value, undoArgs);
      }
    });

    return view;
  }
  render() {
    this.el = this.resizingView.render();

    return this.el;
  }
}
