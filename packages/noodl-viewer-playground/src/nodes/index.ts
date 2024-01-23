import NoodlRuntime from '@noodl/runtime';

export function registerNodes(runtime: NoodlRuntime) {
  [require('./playground/request'), require('./playground/response'), require('./data/aggregatenode')].forEach(
    function (nodeDefinition) {
      runtime.registerNode(nodeDefinition);
    }
  );
}
