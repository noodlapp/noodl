'use strict';

const BooleanToStringNode = {
  name: 'Boolean To String',
  docs: 'https://docs.noodl.net/nodes/utilities/boolean-to-string',
  category: 'Utilities',
  initialize: function () {
    this._internal.inputs = [];
    this._internal.currentSelectedIndex = 0;
    this._internal.indexChanged = false;

    this._internal.trueString = '';
    this._internal.falseString = '';
  },
  inputs: {
    trueString: {
      displayName: 'String for true',
      type: 'string',
      set: function (value) {
        if (this._internal.trueString === value) return;
        this._internal.trueString = value;

        if (this._internal.currentInput) {
          this.flagOutputDirty('currentValue');
        }
      }
    },
    falseString: {
      displayName: 'String for false',
      type: 'string',
      set: function (value) {
        if (this._internal.falseString === value) return;
        this._internal.falseString = value;

        if (!this._internal.currentInput) {
          this.flagOutputDirty('currentValue');
        }
      }
    },
    input: {
      type: { name: 'boolean' },
      displayName: 'Selector',
      set: function (value) {
        if (this._internal.currentInput === value) return;

        this._internal.currentInput = value;
        this.flagOutputDirty('currentValue');
        this.sendSignalOnOutput('inputChanged');
      }
    }
  },
  outputs: {
    currentValue: {
      type: 'string',
      displayName: 'Current Value',
      group: 'Value',
      getter: function () {
        return this._internal.currentInput ? this._internal.trueString : this._internal.falseString;
      }
    },
    inputChanged: {
      type: 'signal',
      displayName: 'Selector Changed',
      group: 'Signals'
    }
  }
};

module.exports = {
  node: BooleanToStringNode
};
