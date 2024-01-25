import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { RuntimeType } from '@noodl-models/nodelibrary/NodeLibraryData';

export function getComponentModelRuntimeType(node: ComponentModel) {
  const name = node.name;

  if (name.startsWith('/#__cloud__/')) {
    return RuntimeType.Cloud;
  } else if (name.startsWith('/#__playground__/')) {
    return RuntimeType.Playground;
  }

  return RuntimeType.Browser;
}

export const isComponentModel_BrowserRuntime = (node: ComponentModel) =>
  getComponentModelRuntimeType(node) === RuntimeType.Browser;
export const isComponentModel_CloudRuntime = (node: ComponentModel) =>
  getComponentModelRuntimeType(node) === RuntimeType.Cloud;
export const isComponentModel_PlaygroundRuntime = (node: ComponentModel) =>
  getComponentModelRuntimeType(node) === RuntimeType.Playground;

export function getNodeGraphNodeRuntimeType(node: NodeGraphNode): RuntimeType {
  // Neue TODO: Cleanup double ternary
  return node?.owner?.owner?.name?.startsWith('/#__cloud__')
    ? RuntimeType.Cloud
    : node?.owner?.owner?.name?.startsWith('/#__playground__')
    ? RuntimeType.Playground
    : RuntimeType.Browser;
}
