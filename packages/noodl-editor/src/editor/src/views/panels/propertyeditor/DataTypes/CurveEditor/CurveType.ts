import React from 'react';
import ReactDOM from 'react-dom';

import { TypeView } from '../../TypeView';
import { getEditType } from '../../utils';

export class CurveType extends TypeView {
  propertyName: TSFixme;
  el: TSFixme;

  static fromPort(args: TSFixme) {
    const view = new CurveType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.displayName = p.displayName ? p.displayName : p.name;
    view.name = p.name;
    view.type = getEditType(p);
    view.default = p.default;
    view.group = p.group;
    view.value = parent.model.getParameter(p.name);
    view.parent = parent;
    view.isConnected = parent.model.isPortConnected(p.name, 'target');
    view.isDefault = parent.model.parameters[p.name] === undefined;

    return view;
  }

  render() {
    this.el = this.bindView(this.parent.cloneTemplate('curve'), this);
    TypeView.prototype.render.call(this);

    return this.el;
  }

  onEditClicked(scope, el, evt) {
    const _this = this;

    this.propertyName = scope.name;

    this.parent.hidePopout();

    const props = {
      value: this.value,
      default: this.default || { curve: [0.0, 0.0, 0.58, 1.0], dur: 300, delay: 0 },
      onUpdate: function (curve, drag) {
        const undoArgs = { undo: true, label: 'curve changed', oldValue: _this.value };
        if (!drag) _this.value = curve;
        _this.parent.model.setParameter(scope.name, curve, drag ? undefined : undoArgs);
        _this.isDefault = false;
      }
    };
    const div = document.createElement('div');
    ReactDOM.render(React.createElement(require('./curveeditor.jsx'), props), div);

    const curveEditorView = {
      el: $(div)
    };

    this.parent.showPopout({
      content: curveEditorView,
      attachTo: el,
      position: 'right'
    });

    evt.stopPropagation();
  }
  resetToDefault() {
    this.value = undefined;
  }
}
