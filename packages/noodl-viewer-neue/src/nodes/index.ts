import NoodlRuntime from '@noodl/runtime';

export function registerNodes(runtime: NoodlRuntime) {
  [
    require('./shNodes/accelerometer'),
    require('./shNodes/commandinput'),
    require('./shNodes/hardwareclock'),
    require('./shNodes/humiditysensor'),
    require('./shNodes/savetelemetry'),
    require('./shNodes/tempsensor'),
    require('./shNodes/sendevent')
  ].forEach(function (nodeDefinition) {
    runtime.registerNode(nodeDefinition);
  });
}
