import { ComponentModel } from '@noodl-models/componentmodel';

import { ProjectModel } from '../projectmodel';
import NodeTypeAdapter from './NodeTypeAdapter';

export class CloudFunctionAdapter extends NodeTypeAdapter {
  events: Record<string, any>;

  constructor() {
    super('CloudFunction2');

    this.events = {
      componentAdded: this.componentAddedOrRemoved.bind(this),
      componentRemoved: this.componentAddedOrRemoved.bind(this),
      componentRenamed: this.componentRenamed.bind(this),
      nodeAdded: this.nodeAddedOrRemoved.bind(this),
      nodeRemoved: this.nodeAddedOrRemoved.bind(this),
      'nodeAdded:CloudFunction2': this.functionNodeAdded.bind(this),
      'nodeAdded:noodl.cloud.request': this.updateAllFunctionsPorts.bind(this),
      'nodeRemoved:noodl.cloud.request': this.updateAllFunctionsPorts.bind(this),
      'nodeAdded:noodl.cloud.response': this.updateAllFunctionsPorts.bind(this),
      'nodeRemoved:noodl.cloud.response': this.updateAllFunctionsPorts.bind(this),
      projectLoaded: this.updateAllFunctionsPorts.bind(this),
      'parametersChanged:noodl.cloud.request': this.updateAllFunctionsPorts.bind(this),
      'parametersChanged:noodl.cloud.response': this.updateAllFunctionsPorts.bind(this),
      'parametersChanged:CloudFunction2': this.functionParametersChanged.bind(this) //update if a router name has changed
    };
  }

  componentAddedOrRemoved(e) {
    const componentName = e.model.fullName;
    if (componentName.startsWith('/#__cloud__/')) {
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
      if ('/#__cloud__/' + f.parameters['function'] === before) {
        f.setParameter('function', after.replace('/#__cloud__/', ''));
      }
    });

    this.updateAllFunctionsPorts();
  }

  updatePortsForNode(node) {
    const ports = [];

    // Collect all cloud function components
    const functionRequestNodes = ProjectModel.instance.getNodesWithType('noodl.cloud.request');
    const functions = functionRequestNodes
      .map((r) => {
        const component = r.owner.owner;
        return component.fullName;
      })
      // Remove all the Cloud Trigger functions
      .filter((x) => !x.startsWith('/#__cloud__/__noodl_cloud_triggers__'));

    ports.push({
      plug: 'input',
      type: {
        name: 'component',
        components: functions,
        ignoreSheetName: true,
        allowEditOnly: true
      },
      group: 'General',
      displayName: 'Function',
      name: 'function'
    });

    if (node.parameters['function'] !== undefined) {
      const component = ProjectModel.instance.getComponentWithName('/#__cloud__/' + node.parameters['function']);
      if (component !== undefined) {
        // Collect inputs from request nodes
        const functionRequests = component.getNodesWithType('noodl.cloud.request');
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
        const functionResponses = component.getNodesWithTypeRecursive('noodl.cloud.response');
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
            group: 'Results'
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
      type.fullName.startsWith('/#__cloud__/') && //...in a cloud function?
      type.graph.forEachNodeRecursive((n) => n.type.name === 'noodl.cloud.response') //...and has a response node?
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
