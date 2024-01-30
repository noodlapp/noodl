import NoodlRuntime from '@noodl/runtime';

export function registerNodes(runtime: NoodlRuntime) {
  [require('./shNodes/DeviceNode'), require('./shNodes/shNode'), require('./shNodes/iENBLNode')].forEach(function (
    nodeDefinition
  ) {
    runtime.registerNode(nodeDefinition);
  });
}
