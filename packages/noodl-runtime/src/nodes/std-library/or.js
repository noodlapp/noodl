'use strict';

const OrNode = {
  name: 'Or',
  docs: 'https://docs.noodl.net/nodes/logic/or',
  category: 'Logic',
  initialize: function () {
    this._internal.inputs = [];
  },
  getInspectInfo() {
    return this._internal.inputs.some(isTrue);
  },
  numberedInputs: {
    input: {
      type: 'boolean',
      displayPrefix: 'Input',
      createSetter(index) {
        return function (value) {
          if (this._internal.inputs[index] === value) {
            return;
          }

          this._internal.inputs[index] = value;
          this.flagOutputDirty('result');
        };
      }
    }
  },
  outputs: {
    result: {
      type: 'boolean',
      displayName: 'Result',
      getter: function () {
        return this._internal.inputs.some(isTrue);
      }
    }
  }
};

module.exports = {
  node: OrNode
};

function isTrue(value) {
  return value ? true : false;
}
