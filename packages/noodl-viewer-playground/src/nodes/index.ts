import NoodlRuntime from '@noodl/runtime';

export function registerNodes(runtime: NoodlRuntime) {
  [require('./shNodes/DeviceNode'), require('./shNodes/shNode'), require('./data/aggregatenode')].forEach(function (
    nodeDefinition
  ) {
    runtime.registerNode(nodeDefinition);
  });
}
