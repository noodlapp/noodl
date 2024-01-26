'use strict';

function invert(value) {
  if (value === undefined) {
    return undefined;
  }
  return !value;
}

const InverterNode = {
  name: 'Inverter',
  docs: 'https://docs.noodl.net/nodes/logic/inverter',
  category: 'Logic',
  initialize: function () {
    this._internal.currentValue = undefined;
  },
  getInspectInfo() {
    return String(invert(this._internal.currentValue));
  },
  inputs: {
    value: {
      type: {
        name: 'boolean'
      },
      displayName: 'Value',
      set: function (value) {
        this._internal.currentValue = value;
        this.flagOutputDirty('result');
      }
    }
  },
  outputs: {
    result: {
      type: 'boolean',
      displayName: 'Result',
      getter: function () {
        return invert(this._internal.currentValue);
      }
    }
  }
};

module.exports = {
  node: InverterNode
};
