import { each } from 'underscore';

import { ProjectModel } from '@noodl-models/projectmodel';
import { isComponentModel_CloudRuntime } from '@noodl-utils/NodeGraph';

export function getIdentifiers(project: ProjectModel) {
  const identifiers = {};

  project.forEachComponent((component) => {
    component.forEachNode((node) => {
      each(node.getPorts(), (port) => {
        const identifierOf = port.type.identifierOf;
        if (!identifierOf) return;

        if (!identifiers[identifierOf]) {
          identifiers[identifierOf] = new Set<string>();
        }

        const name = node.parameters[port.name];
        if (name) {
          identifiers[identifierOf].add(name);
        }
      });
    });
  });

  return identifiers;
}

export interface CloudFunctionMetadata {
  name: string;
  displayName: string;
  fullName: string;
  inputs: {
    name: string;
    type: string | { name: string };
  }[];
  outputs: {
    name: string;
    types: (string | { name: string })[];
  }[];
}

export function getCloudFunctions(project: ProjectModel): CloudFunctionMetadata[] {
  const functions: CloudFunctionMetadata[] = [];

  const components = project.getComponents().filter(isComponentModel_CloudRuntime);
  components.forEach((component) => {
    const nodes = component.getNodes();
    const requestNode = nodes.find((x) => x.typename === 'noodl.cloud.request');
    if (!requestNode) return;

    // ---
    // Find all the outputs and types from connections
    const outputs = {};

    const responseNodes = nodes.filter((x) => x.typename === 'noodl.cloud.response');
    responseNodes.forEach((responseNode) => {
      const ports = responseNode.getPorts('input');

      ports.forEach((port) => {
        if (!port.name.startsWith('pm-')) return;

        if (!outputs[port.name]) {
          outputs[port.name] = {
            name: port.name,
            types: []
          };
        }

        if (!outputs[port.name].types.includes(port.type)) {
          outputs[port.name].types.push(port.type);
        }
      });
    });

    // ---
    // Find all the inputs and types from connections
    const inputs = [];

    const requestNodeConnections = requestNode.getConnectionsOnThisNode();
    requestNodeConnections.forEach((connection) => {
      if (!connection.fromProperty.startsWith('pm-')) return;

      const connectedNode = nodes.find((x) => x.id === connection.toId);
      if (!connectedNode) return;

      const connectedPort = connectedNode.getPort(connection.toProperty, 'input');
      if (!connectedPort) return;

      // TODO: Maybe it should take all the outputs instead of the connections?
      inputs.push({
        name: connection.fromProperty,
        type: connectedPort.type
      });
    });

    // ---
    // Add the function
    functions.push({
      name: component.name,
      displayName: component.displayName,
      fullName: component.fullName,
      inputs,
      outputs: Object.values(outputs)
    });
  });

  return functions;
}
