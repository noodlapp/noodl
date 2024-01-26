'use strict';

const VariableBase = require('@noodl/runtime/src/nodes/std-library/variables/variablebase');

module.exports = {
  node: VariableBase.createDefinition({
    name: 'Color',
    docs: 'https://docs.noodl.net/nodes/data/color',
    startValue: '#f1f2f4',
    nodeDoubleClickAction: {
      focusPort: 'value'
    },
    type: {
      name: 'color'
    },
    cast: function (value) {
      return value;
    }
  })
};
