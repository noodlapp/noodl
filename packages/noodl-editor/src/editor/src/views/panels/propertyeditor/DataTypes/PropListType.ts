import PropList from '../proplist';
import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

export class PropListType extends TypeView {
  childViews: TSFixme[];
  listView: TSFixme;

  constructor() {
    super();

    this.childViews = [];
  }

  static fromPort(args) {
    const view = new PropListType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.displayName = p.displayName ? p.displayName : p.name;
    view.name = p.name;
    view.type = getEditType(p);
    view.group = p.group;
    if (parent.model.parameters[p.name] === '') parent.model.parameters[p.name] = undefined;
    view.value = parent.model.getParameter(p.name);
    view.parent = parent;
    // view.isConnected = parent.model.isPortConnected(p.name,'target');
    // view.isDefault = parent.model.parameters[p.name] === undefined;
    return view;
  }

  render() {
    const _this = this;

    this.listView = new PropList({
      title: this.displayName,
      list: this.value,
      isDefault: _this.parent.model.parameters[_this.name] === undefined,
      childViews: this.childViews,
      type: this.type,
      onUpdate: function (newValue) {
        if (newValue === '') newValue = undefined;

        _this.parent.setParameter(_this.name, newValue);
        _this.parent.notifyListeners('panelResized');

        return {
          value: _this.parent.model.getParameter(_this.name),
          isDefault: _this.parent.model.parameters[_this.name] === undefined
        };
      }
    });
    this.listView.render();

    this.el = this.listView.el;

    return this.el;
  }

  addChildTypeView(child) {
    this.childViews.push(child);
  }
}
