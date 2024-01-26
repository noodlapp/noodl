import React from 'react';
import ReactDOM from 'react-dom';

import QueryEditor from '../components/QueryEditor';
import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

export class QuerySortingType extends TypeView {
  public static fromPort(args: TSFixme) {
    const view = new QuerySortingType();

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

  public render() {
    const onChange = (sorting: TSFixme) => {
      const undoArgs = { undo: true, label: 'query changed', oldValue: this.value };
      this.value = sorting;
      this.parent.model.setParameter(this.name, sorting, undoArgs);
      this.isDefault = false;
    };

    const renderSorting = () => {
      const props = {
        sorting: this.value,
        schema: this.type.schema,
        onChange
      };

      ReactDOM.render(React.createElement(QueryEditor.Sorting, props), div);
    };

    const div = document.createElement('div');
    renderSorting();

    this.el = $(div);

    return this.el;
  }
}
