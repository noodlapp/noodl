import NoodlRuntime from '@noodl/runtime';

export function registerNodes(runtime: NoodlRuntime) {
  [require('./cloud/request'), 
  require('./cloud/response'),
  require('./data/aggregatenode')]
  .forEach(function (nodeDefinition) {
    runtime.registerNode(nodeDefinition);
  });
}
