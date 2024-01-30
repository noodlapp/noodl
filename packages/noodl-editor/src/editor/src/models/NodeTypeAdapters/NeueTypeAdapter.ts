import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeLibrary } from '@noodl-models/nodelibrary';

import { ProjectModel } from '../projectmodel';
import NodeTypeAdapter from './NodeTypeAdapter';

export class NeueTypeAdapter extends NodeTypeAdapter {
  events: Record<string, any>;

  constructor() {
    super('NeueTypeAdapter');

    this.events = {
      componentAdded: this.componentAddedOrRemoved.bind(this),
      componentRemoved: this.componentAddedOrRemoved.bind(this),
      componentRenamed: this.componentRenamed.bind(this),
      nodeAdded: this.nodeAddedOrRemoved.bind(this),
      nodeRemoved: this.nodeAddedOrRemoved.bind(this),
      'nodeAdded:Neue': this.functionNodeAdded.bind(this),
      'nodeRemoved:Neue': this.updateAllFunctionsPorts.bind(this),
      projectLoaded: this.updateAllFunctionsPorts.bind(this),
      'parametersChanged:Neue': this.updateAllFunctionsPorts.bind(this),
    };
  }

  componentAddedOrRemoved(e) {
    const componentName = e.model.fullName;
    if (componentName.startsWith('/#__neue__/')) {
      // A cloud function node is possibly removed, update all functions
      this.updateAllFunctionsPorts();
    }
  }

  componentRenamed(e) {
    const before = e.oldName;
    const after = e.model.fullName;

    // Note: No need to handle undo here as it will simply revert back to a new renamne
    // Find all functions that have this component as it's function and change
    const functionNodes = this.findAllNodes();

    functionNodes.forEach((f) => {
      if ('/#__neue__/' + f.parameters['neue'] === before) {
        f.setParameter('function', after.replace('/#__neue__/', ''));
      }
    });

    this.updateAllFunctionsPorts();
  }

  updatePortsForNode(node) {
    const ports = [];

    // Collect all cloud function components
    const functionRequestNodes = ProjectModel.instance.getNodesWithType('Neue');
    const functions = functionRequestNodes.map((r) => {
      const component = r.owner.owner;
      return component.fullName;
    });

    ports.push({
      plug: 'input',
      type: {
        name: 'component',
        components: functions,
        ignoreSheetName: true,
        allowEditOnly: true
      },
      group: 'Neue',
      displayName: 'Neue',
      name: 'neue'
    });

    if (node.parameters['neue'] !== undefined) {
      const component = ProjectModel.instance.getComponentWithName('/#__neue__/' + node.parameters['neue']);
      if (component !== undefined) {
        // Collect inputs from request nodes
        const functionRequests = component.getNodesWithType('Neue');
        if (functionRequests !== undefined) {
          const uniqueNames = {};

          functionRequests.forEach((pi) => {
            if (pi.parameters['params'] !== undefined)
              pi.parameters['params'].split(',').forEach((p) => (uniqueNames[p] = true));
          });

          Object.keys(uniqueNames).forEach((inputName) => {
            ports.push({
              name: 'in-' + inputName,
              displayName: inputName,
              type: '*',
              plug: 'input',
              group: 'Parameters'
            });
          });
        }

        // Collect outputs from response nodes
        const functionResponses = component.getNodesWithTypeRecursive('Neue');
        const uniqueNames = {};

        functionResponses.forEach((pi) => {
          if (pi.parameters['params'] !== undefined)
            pi.parameters['params'].split(',').forEach((p) => (uniqueNames[p] = true));
        });

        Object.keys(uniqueNames).forEach((inputName) => {
          ports.push({
            name: 'out-' + inputName,
            displayName: inputName,
            type: '*',
            plug: 'output',
            group: 'Hardware'
          });
        });
      }
    }

    node.setDynamicPorts(ports);
  }

  functionNodeAdded(e) {
    this.updatePortsForNode(e.args.model);
  }

  nodeAddedOrRemoved(e) {
    const type = e.args.model.type;

    if (
      type instanceof ComponentModel && //is this node an instance of a component?
      type.fullName.startsWith('/#__neue__/') && //...in a cloud function?
      type.graph.forEachNodeRecursive((n) => n.type.name === 'Neue') //...and has a response node?
    ) {
      this.updateAllFunctionsPorts();
    }
  }

  updateAllFunctionsPorts() {
    // We need to update all function nodes
    const functionNodes = this.findAllNodes();
    functionNodes.forEach((node) => {
      this.updatePortsForNode(node);
    });
  }

  functionParametersChanged(e) {
    this.updatePortsForNode(e.model);
  }
}
