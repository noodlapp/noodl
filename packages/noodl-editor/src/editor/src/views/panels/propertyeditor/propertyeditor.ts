import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import _ from 'underscore';
import React from 'react';
import ReactDOM from 'react-dom';

import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { UndoQueue, UndoActionGroup } from '@noodl-models/undo-queue-model';

import View from '../../../../../shared/view';
import { ProjectModel } from '../../../models/projectmodel';
import { ToastLayer } from '../../ToastLayer/ToastLayer';
import { VariantsEditor } from './components/VariantStates';
import { VisualStates } from './components/VisualStates';
import { Ports } from './DataTypes/Ports';
import { ModelProxy } from './models/modelProxy';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PropertyEditorTemplate = require('../../../templates/propertyeditor/propertyeditor.html');

// Styles
require('../../../styles/propertyeditor/propertyeditor.css');

export class PropertyEditor extends View {
  parent: TSFixme;
  model: TSFixme;
  modelProxy: ModelProxy;
  allowAsRoot: TSFixme;
  portsView: TSFixme;
  renderPortsViewScheduled: TSFixme;

  constructor(args) {
    super();

    this.parent = args.parent;
    this.model = args.model;

    this.modelProxy = new ModelProxy({ model: this.model });

    //this.isRoot = ProjectModel.instance.getRootNode() === this.model;
    this.allowAsRoot = this.model.type.allowAsExportRoot;
  }

  dispose() {
    this.portsView.dispose();
  }
  scheduleRenderPortsView() {
    if (this.renderPortsViewScheduled) return;

    const _this = this;
    this.renderPortsViewScheduled = true;
    setTimeout(function () {
      _this.renderPortsViewScheduled = false;
      _this.renderPortsView();
    }, 0);
  }
  renderPortsView() {
    this.portsView.render();
    this.$('.groups').html(this.portsView.el);
  }
  renderVariantsEditor() {
    if (this.model.type.useVariants) {
      const props = {
        model: this.model,
        onEditVariant: () => {
          // Hide top panel when editing variant
          this.$('.property-editor-label-and-buttons').hide();
          this.modelProxy.setEditMode('variant');
          this.scheduleRenderPortsView();

          this.$('.sidebar-property-editor').addClass('variants-sidepanel-edit-mode');
        },
        onDoneEditingVariant: () => {
          this.$('.property-editor-label-and-buttons').show();
          this.modelProxy.setEditMode('node');
          this.scheduleRenderPortsView();
          this.$('.sidebar-property-editor').removeClass('variants-sidepanel-edit-mode');
        }
      };
      ReactDOM.render(React.createElement(VariantsEditor, props), this.$('.variants')[0]);
    }
  }
  renderVisualStates() {
    if (this.model.type.visualStates !== undefined) {
      const props = {
        model: this.modelProxy,
        onVisualStateChanged: this.onVisualStateChanged.bind(this),
        portsView: this.portsView
      };
      ReactDOM.render(React.createElement(VisualStates, props), this.$('.visual-states')[0]);
    }
  }
  onVisualStateChanged(state) {
    this.modelProxy.setVisualState(state.name);

    // Interaction state changed, schedule
    this.scheduleRenderPortsView();
  }
  render() {
    this.el = this.bindView($(PropertyEditorTemplate), this);

    this.portsView = new Ports({
      model: this.modelProxy
    });
    this.renderPortsView();

    this.renderVariantsEditor();

    this.renderVisualStates();

    this.parent && this.parent.append(this.el);

    return this.el;
  }

  performDelete() {
    if (!this.model.canBeDeleted()) {
      ToastLayer.showError('This node cannot be deleted');
      return;
    }

    const graph = this.model.owner;
    const undo = new UndoActionGroup({ label: 'delete node' });
    graph.removeNode(this.model, { undo: undo });
    UndoQueue.instance.push(undo);
  }

  _tryPropertyPanelInputInteraction(inputIdentifier: string) {
    const input = document.querySelector(
      `div[data-panel-id="PropertyEditor"] [data-identifier="${inputIdentifier}"]`
    ) as HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement;

    if (input) {
      setTimeout(() => {
        switch (input?.nodeName) {
          case 'BUTTON': {
            input.click();

            // if the button click opens a code editor we want to focus that
            const codeEditor =
              (document.querySelector('.monaco-editor .inputarea') as HTMLTextAreaElement) || undefined;

            if (codeEditor) {
              codeEditor.focus();
            }
            break;
          }

          case 'INPUT': {
            if (input.dataset.type === 'color') {
              input.click();
            } else {
              input.focus();
            }
            break;
          }

          default: {
            input.focus();
          }
        }

        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1);
    }
  }

  doubleClick(node: NodeGraphNode) {
    if (node.metadata?.AiAssistant) {
      const aiButton = document.querySelector<HTMLButtonElement>('button[data-test="ai-code-editor"]');
      if (aiButton) {
        setTimeout(() => {
          aiButton.click();
          $('.monaco-editor .inputarea')[0].focus();
        }, 1);
      }
    } else if (node.type.name === 'CloudFunction2') {
      const functionName = '/#__cloud__/' + node.parameters.function;
      const component = ProjectModel.instance.getComponentWithName(functionName);
      if (component) {
        NodeGraphContextTmp.switchToComponent(component, { pushHistory: true });
      } else {
        ToastLayer.showError('Could not find Cloud Function in project.');
      }
    } else if (node.type.nodeDoubleClickAction) {
      if (Array.isArray(node.type.nodeDoubleClickAction)) {
        node.type.nodeDoubleClickAction.forEach((action) => {
          this._tryPropertyPanelInputInteraction(action.focusPort);
        });
      } else {
        this._tryPropertyPanelInputInteraction(node.type.nodeDoubleClickAction.focusPort);
      }
    }
  }

  /*PropertyEditor.prototype.onMakeRootClicked = function (scope, el, evt) {
    if (ProjectModel.instance.getRootNode() === this.model) {
      ProjectModel.instance.setRootNode(undefined);
      this.isRoot = false;
    }
    else {
      ProjectModel.instance.setRootNode(this.model);
      this.isRoot = true;
    }
  }*/
}
