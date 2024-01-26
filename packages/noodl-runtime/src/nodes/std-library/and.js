'use strict';

const AndNode = {
  name: 'And',
  docs: 'https://docs.noodl.net/nodes/logic/and',
  category: 'Logic',
  initialize: function () {
    this._internal.inputs = [];
  },
  getInspectInfo() {
    return and(this._internal.inputs);
  },
  numberedInputs: {
    input: {
      displayPrefix: 'Input',
      type: 'boolean',
      createSetter(index) {
        return function (value) {
          value = value ? true : false;

          if (this._internal.inputs[index] === value) {
            return;
          }

          this._internal.inputs[index] = value;
          const result = and(this._internal.inputs);

          if (this._internal.result !== result) {
            this._internal.result = result;
            this.flagOutputDirty('result');
          }
        };
      }
    }
  },
  outputs: {
    result: {
      type: 'boolean',
      displayName: 'Result',
      get() {
        return this._internal.result;
      }
    }
  }
};

module.exports = {
  node: AndNode
};

function and(values) {
  //if none are false, then return true
  return values.length > 0 && values.some((v) => !v) === false;
}
