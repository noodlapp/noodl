'use strict';

const VariableBase = require('./variablebase');

const NumberNode = VariableBase.createDefinition({
  name: 'Number',
  docs: 'https://docs.noodl.net/nodes/data/number',
  startValue: 0,
  nodeDoubleClickAction: {
    focusPort: 'value'
  },
  type: {
    name: 'number'
  },
  cast: function (value) {
    return Number(value);
  }
});

module.exports = {
  node: NumberNode
};
