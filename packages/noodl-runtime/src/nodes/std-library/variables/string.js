'use strict';

const VariableBase = require('./variablebase');
const { NodeDefinition } = require('../../../../noodl-runtime');

const StringNode = VariableBase.createDefinition({
  name: 'String',
  docs: 'https://docs.noodl.net/nodes/data/string',
  shortDesc: 'Contains a string (text).',
  startValue: '',
  nodeDoubleClickAction: {
    focusPort: 'value'
  },
  type: {
    name: 'string'
  },
  cast: function (value) {
    return String(value);
  },
  onChanged: function () {
    this.flagOutputDirty('length');
  }
});

NodeDefinition.extend(StringNode, {
  usePortAsLabel: 'value',
  portLabelTruncationMode: 'length',
  outputs: {
    length: {
      type: 'number',
      displayName: 'Length',
      getter: function () {
        return this._internal.currentValue.length;
      }
    }
  }
});

module.exports = {
  node: StringNode
};
