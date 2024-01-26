import React from 'react';
import ReactDOM from 'react-dom';

import QueryEditor from '../components/QueryEditor';
import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

export class QueryFilterType extends TypeView {
  static fromPort(args) {
    const view = new QueryFilterType();

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
    const onChange = (filter) => {
      const undoArgs = { undo: true, label: 'query changed', oldValue: this.value };
      this.value = filter;
      this.parent.model.setParameter(this.name, filter, undoArgs);
      this.isDefault = false;
    };

    const renderFilters = () => {
      const props = {
        filter: this.value,
        schema: this.type.schema,
        onChange
      };

      ReactDOM.render(React.createElement(QueryEditor.Filter, props), div);
    };

    const div = document.createElement('div');
    renderFilters();

    this.el = $(div);

    return this.el;
  }
}
