import React from 'react';
import ReactDOM from 'react-dom';

import { IconName } from '@noodl-core-ui/components/common/Icon';

import View from '../../../../../shared/view';
import { ComponentModel } from '../../../models/componentmodel';
import { NodeGraphModel } from '../../../models/nodegraphmodel';
import { RouterAdapter } from '../../../models/NodeTypeAdapters/RouterAdapter';
import Utils from '../../../utils/utils';
import PopupLayer from '../../popuplayer';
import { PageComponentTemplatePopup } from './PageTemplatePopup';

class ComponentTemplate {
  parentTypes: string[];
  runtimeTypes: string[];
  template: any;
  label: string;
  icon: IconName;

  constructor(label, icon) {
    this.label = label;
    this.icon = icon;
  }

  createComponent(componentName, options, undoGroup) {
    // Create component from template
    const component = new ComponentModel({
      name: componentName,
      graph: NodeGraphModel.fromJSON(JSON.parse(JSON.stringify(this.template))),
      id: Utils.guid()
    });

    component.rekeyAllIds();

    return component;
  }

  createPopup(options: any): { el: JQuery<HTMLElement> } {
    const popup = new PopupLayer.StringInputPopup({
      label: 'New component name',
      okLabel: 'Add',
      cancelLabel: 'Cancel',
      onOk(localName) {
        options.onCreate(localName);
      },
      onCancel() {
        options.onCancel && options.onCancel();
      }
    });
    popup.render();

    return popup;
  }
}

class VisualComponentTemplate extends ComponentTemplate {
  constructor() {
    super('Visual Component', IconName.Component);

    this.parentTypes = ['folder', 'component'];
    this.runtimeTypes = ['browser'];

    this.template = {
      connections: [],
      roots: [
        {
          id: 'xxx',
          type: 'Group',
          x: 0,
          y: 0,
          parameters: {},
          ports: [],
          dynamicports: [],
          children: []
        }
      ]
    };
  }
}

class LogicComponentTemplate extends ComponentTemplate {
  constructor() {
    super('Logic Component', IconName.Component);

    this.parentTypes = ['folder', 'component'];
    this.runtimeTypes = ['cloud', 'browser'];

    this.template = {
      connections: [],
      roots: [
        {
          id: 'A',
          type: 'Component Inputs',
          x: 0,
          y: 0,
          parameters: {},
          ports: [
            {
              name: 'Do',
              plug: 'output',
              type: '*'
            }
          ],
          dynamicports: [],
          children: []
        },
        {
          id: 'B',
          type: 'Component Outputs',
          x: 300,
          y: 0,
          parameters: {},
          ports: [
            {
              name: 'Success',
              plug: 'input',
              type: '*'
            },
            {
              name: 'Failure',
              plug: 'input',
              type: '*'
            }
          ],
          dynamicports: [],
          children: []
        }
      ]
    };
  }
}

class CloudFunctionComponentTemplate extends ComponentTemplate {
  constructor() {
    super('Cloud Function Component', IconName.CloudFunction);

    this.parentTypes = ['folder'];
    this.runtimeTypes = ['cloud'];

    this.template = {
      connections: [],
      roots: [
        {
          id: 'A',
          type: 'noodl.cloud.request',
          x: 0,
          y: 0,
          parameters: {},
          ports: [],
          dynamicports: [],
          children: []
        },
        {
          id: 'B',
          type: 'noodl.cloud.response',
          x: 300,
          y: 0,
          parameters: {},
          ports: [],
          dynamicports: [],
          children: []
        }
      ]
    };
  }
}

class PageComponentTemplate extends ComponentTemplate {
  constructor() {
    super('Page Component', IconName.File);

    this.parentTypes = ['folder'];
    this.runtimeTypes = ['browser'];

    this.template = {
      connections: [],
      roots: [
        {
          id: 'xxx',
          type: 'Page',
          x: 0,
          y: 0,
          parameters: {},
          ports: [],
          dynamicports: [],
          children: []
        },
        {
          id: 'yyy',
          type: 'PageInputs',
          x: -100,
          y: -50,
          parameters: {},
          ports: [],
          dynamicports: [],
          children: []
        }
      ]
    };
  }

  createComponent(componentName, options, undoGroup) {
    // Create component from template
    const component = new ComponentModel({
      name: componentName,
      graph: NodeGraphModel.fromJSON(JSON.parse(JSON.stringify(this.template))),
      id: Utils.guid()
    });

    component.rekeyAllIds();

    // Find the router and add the template to the router
    RouterAdapter.addPageToRouters(options.router, componentName, { undo: undoGroup });

    return component;
  }

  createPopup(options: any) {
    // Find all routers in the project
    const _routers = RouterAdapter.getRouterNames();

    const props = {
      routers: _routers,
      onCreate(localName, router) {
        options.onCreate(localName, { router });
      },
      onCancel() {
        options.onCancel && options.onCancel();
      }
    };
    const div = document.createElement('div');
    ReactDOM.render(React.createElement(PageComponentTemplatePopup, props), div);

    return { el: $(div) };
  }
}

/**
 * Panel that opens in the sidepanel components header plus icon
 */
export class ComponentTemplates {
  templates: ComponentTemplate[];

  constructor() {
    this.templates = [
      new PageComponentTemplate(),
      new VisualComponentTemplate(),
      new LogicComponentTemplate(),
      new CloudFunctionComponentTemplate()
    ];
  }

  getTemplates(args) {
    if (args && (args.forParentType || args.forRuntimeType)) {
      return this.templates.filter(
        (t) =>
          (args.forParentType === undefined || t.parentTypes.indexOf(args.forParentType) !== -1) &&
          (args.forRuntimeType === undefined || t.runtimeTypes.indexOf(args.forRuntimeType) !== -1)
      );
    }
    return this.templates;
  }

  static instance = new ComponentTemplates();
}
