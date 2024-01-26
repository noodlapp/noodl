import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { RuntimeType } from '@noodl-models/nodelibrary/NodeLibraryData';

export function getComponentModelRuntimeType(node: ComponentModel) {
  const name = node.name;

  if (name.startsWith('/#__cloud__/')) {
    return RuntimeType.Cloud;
  }

  return RuntimeType.Browser;
}

export const isComponentModel_BrowserRuntime = (node: ComponentModel) =>
  getComponentModelRuntimeType(node) === RuntimeType.Browser;
export const isComponentModel_CloudRuntime = (node: ComponentModel) =>
  getComponentModelRuntimeType(node) === RuntimeType.Cloud;

export function getNodeGraphNodeRuntimeType(node: NodeGraphNode): RuntimeType {
  return node?.owner?.owner?.name?.startsWith('/#__cloud__') ? RuntimeType.Cloud : RuntimeType.Browser;
}
