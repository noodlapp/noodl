import { find, clone } from 'underscore';

import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { NodeLibrary } from '@noodl-models/nodelibrary';

export function exportConnection(other: { fromId: string; fromProperty: string; toId: string; toProperty: string }) {
  return {
    sourceId: other.fromId,
    sourcePort: other.fromProperty,
    targetId: other.toId,
    targetPort: other.toProperty
  };
}

export function exportPorts(node: TSFixme) {
  const exports = [];
  const ports = node.getPorts();
  for (const i in ports) {
    const p = ports[i];

    // Ignore ports with types that are not resolved
    if (NodeLibrary.nameForPortType(p.type) === '=') continue;

    // Only instances ports are exported. Export the port if it is not a type port
    if (
      node.type.exportDynamicPorts &&
      !find(node.type.ports, function (_p) {
        return _p.name === p.name;
      })
    ) {
      exports.push(p);
    }
  }
  return exports;
}

export function exportNode(node: NodeGraphNode) {
  const json = {
    id: node.id,
    type: node.type.name,
    version: node.version,
    variant: node.variant ? node.variant.name : undefined,
    parameters: clone(node.parameters),
    stateParameters: node.stateParameters ? clone(node.stateParameters) : undefined,
    stateTransitions: node.stateTransitions ? clone(node.stateTransitions) : undefined,
    defaultStateTransitions: node.defaultStateTransitions ? clone(node.defaultStateTransitions) : undefined,
    ports: exportPorts(node),
    children: []
  };

  for (const i in node.children) {
    const child = node.children[i];

    json.children.push(exportNode(child));
  }

  return json;
}

export function exportComponent(comp: ComponentModel) {
  const json: TSFixme = { name: comp.name };

  json.nodes = [];
  json.connections = [];
  json.ports = [];
  json.roots = [];
  json.metadata = comp.metadata;

  // Export roots
  for (const i in comp.graph.roots) {
    const n = comp.graph.roots[i];

    json.nodes.push(exportNode(n));

    // Add nodes that may be children to the root array
    if (n.type.allowAsChild) json.roots.push(n.id);
  }

  // Export connections
  for (const i in comp.graph.connections) {
    const c = comp.graph.connections[i];

    const health = comp.graph.getConnectionHealth({
      sourceId: c.fromId,
      sourcePort: c.fromProperty,
      targetId: c.toId,
      targetPort: c.toProperty
    });
    if (health.healthy) {
      json.connections.push(exportConnection(c));
    }
  }

  // Export component ports
  const ports = comp.getPorts();
  for (const i in ports) {
    const p = ports[i];

    // Only export types that are resolved
    if (p.type) json.ports.push(p);
  }

  return json;
}

/** TODO: Where is this used? */
export function getNodesWithType(type: TSFixme, allComponents: TSFixme) {
  const result = [];

  allComponents.forEach((c) => {
    c.forEachNode((n) => {
      if (n.type.name === type) {
        result.push(n);
      }
    });
  });

  return result;
}

export function exportSettings(project: TSFixme) {
  const settings = project ? project.getSettings() : {};
  const result = {};

  const p = NodeLibrary.instance.getProjectSettingsPorts();
  const settingsPorts = (p.ports || []).concat(p.dynamicports || []);

  for (const prop in settings) {
    const port = settingsPorts.find((p) => p.name === prop);
    if (!port || !port.ignoreInExport) {
      result[prop] = settings[prop];
    }
  }

  return result;
}

export function exportVariant(variant: TSFixme) {
  return {
    name: variant.name,
    typename: variant.typename,
    parameters: variant.parameters,
    stateParameters: variant.stateParameters,
    stateTransitions: variant.stateTransitions,
    defaultStateTransitions: variant.defaultStateTransitions
  };
}
