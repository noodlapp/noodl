'use strict';

const VariableBase = require('./variablebase');

const BooleanNode = VariableBase.createDefinition({
  name: 'Boolean',
  docs: 'https://docs.noodl.net/nodes/data/boolean',
  startValue: false,
  type: {
    name: 'boolean'
  },
  cast: function (value) {
    return Boolean(value);
  }
});

module.exports = {
  node: BooleanNode
};
