import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { RuntimeType } from '@noodl-models/nodelibrary/NodeLibraryData';

export function getComponentModelRuntimeType(node: ComponentModel) {
  const name = node.name;

  if (name.startsWith('/#__cloud__/')) {
    return RuntimeType.Cloud;
  }
  //Neue
  else if (name.startsWith('/#__neue__/')) {
    return RuntimeType.Neue;
  }

  return RuntimeType.Browser;
}

export const isComponentModel_BrowserRuntime = (node: ComponentModel) =>
  getComponentModelRuntimeType(node) === RuntimeType.Browser;
export const isComponentModel_CloudRuntime = (node: ComponentModel) =>
  getComponentModelRuntimeType(node) === RuntimeType.Cloud;
export const isComponentModel_NeueRuntime = (node: ComponentModel) =>
  getComponentModelRuntimeType(node) === RuntimeType.Neue;
export function getNodeGraphNodeRuntimeType(node: NodeGraphNode): RuntimeType {
  return node?.owner?.owner?.name?.startsWith('/#__cloud__')
    ? RuntimeType.Cloud
    : node?.owner?.owner?.name?.startsWith('/#__neue__')
    ? RuntimeType.Neue
    : RuntimeType.Browser;
}
