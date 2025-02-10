import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { type Warning, WarningsModel } from '@noodl-models/warningsmodel';

import { ProjectModel } from '../projectmodel';
import NodeTypeAdapter from './NodeTypeAdapter';

export class RouterNavigateAdapter extends NodeTypeAdapter {
  events: Record<string, any>;

  constructor() {
    super('RouterNavigate');

    this.events = {
      'nodeAdded:RouterNavigate': this.navigateNodeAdded.bind(this),
      'nodeAdded:Router': this.updateAllRouterPorts.bind(this),
      'nodeRemoved:Router': this.updateAllRouterPorts.bind(this),
      projectLoaded: this.updateAllRouterPorts.bind(this),
      'parametersChanged:RouterNavigate': this.updateRouterPorts.bind(this),
      'parametersChanged:PageInputs': this.updateAllRouterPorts.bind(this),
      'parametersChanged:Router': this.routerParametersChanged.bind(this) //update if a router name has changed
    };
  }

  updatePortsForNode(node: NodeGraphNode) {
    const ports = [];

    const routers = ProjectModel.instance.getNodesWithType('Router').filter((r) => r.parameters['name'] !== undefined);
    if (routers.length > 1) {
      ports.push({
        plug: 'input',
        type: {
          name: 'enum',
          enums: routers.map((r) => ({ label: r.parameters['name'], value: r.parameters['name'] })),
          allowEditOnly: true
        },
        group: 'General',
        displayName: 'Router',
        name: 'router'
      });
    }

    let routerName = node.parameters['router'];
    if (routerName === undefined && routers.length > 0) {
      // No router selected, just pick the first one
      routerName = routers[0].parameters['name'];
      node.setParameter('router', routerName);
    }

    // Router is selected find all pages and show in pages enum
    const pageComponents = [];
    routers
      .filter((r) => r.parameters['name'] === routerName)
      .forEach((r) => {
        if (r.parameters['pages'] !== undefined && r.parameters['pages'].routes !== undefined) {
          r.parameters['pages'].routes.forEach((pc) => {
            if (pageComponents.indexOf(pc) === -1) pageComponents.push(pc);
          });
        }
      });

    ports.push({
      plug: 'input',
      type: { name: 'component', title: 'Choose page component', components: pageComponents, allowEditOnly: true },
      group: 'General',
      displayName: 'Target Page',
      name: 'target'
    });

    if (node.parameters['target'] !== undefined) {
      const component = ProjectModel.instance.getComponentWithName(node.parameters['target']);
      if (component !== undefined) {
        const pageInputs = component.getNodesWithType('PageInputs');
        if (pageInputs !== undefined) {
          const uniqueNames = {};

          pageInputs.forEach((pi) => {
            if (pi.parameters['pathParams'] !== undefined)
              pi.parameters['pathParams'].split(',').forEach((p) => (uniqueNames[p] = true));
            if (pi.parameters['queryParams'] !== undefined)
              pi.parameters['queryParams'].split(',').forEach((p) => (uniqueNames[p] = true));
          });

          Object.keys(uniqueNames).forEach((inputName) => {
            ports.push({
              name: 'pm-' + inputName,
              displayName: inputName,
              type: 'string',
              plug: 'input',
              group: 'Parameters'
            });
          });
        }
      }
    }

    this.evaluateHealth(node, pageComponents);

    node.setDynamicPorts(ports);
  }

  evaluateHealth(node, pageComponents) {
    const target = node.parameters['target'];

    const hasValidTarget = target && pageComponents.includes(target);

    const warning: Warning =
      hasValidTarget === false
        ? {
            message: "The target page doesn't belong to the target router",
            level: 'error',
            showGlobally: true
          }
        : undefined;

    const componentModel = node.owner.owner;
    WarningsModel.instance.setWarning(
      { component: componentModel, node, key: 'routernav-target-not-in-router' },
      warning
    );
  }

  navigateNodeAdded(e) {
    this.updatePortsForNode(e.args.model);
  }

  updateRouterPorts(e) {
    this.updatePortsForNode(e.model);
  }

  updateAllRouterPorts() {
    // We need to update all navigation nodes
    const navigateNodes = this.findAllNodes();
    navigateNodes.forEach((node) => {
      this.updatePortsForNode(node);
    });
  }

  routerParametersChanged(e) {
    // The name of a router has changed, update all navigate nodes with that name
    // No need for an undo here, the value will just changed back when the router renamed is "undone"
    if (e.args.name === 'name' && e.args.oldValue !== e.args.value) {
      const navigateNodes = this.findAllNodes();
      navigateNodes.forEach((node) => {
        if (node.parameters['router'] === e.args.oldValue) {
          node.parameters['router'] = e.args.value;
        }
      });
    }

    this.updateAllRouterPorts();
  }
}
