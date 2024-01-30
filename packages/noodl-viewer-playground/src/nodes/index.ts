import NoodlRuntime from '@noodl/runtime';

export function registerNodes(runtime: NoodlRuntime) {
  [require('./shNodes/DeviceNode'), require('./shNodes/shNode')].forEach(function (nodeDefinition) {
    runtime.registerNode(nodeDefinition);
  });
}
