'use strict';

const StringSelectorNode = {
  name: 'String Selector',
  displayNodeName: 'Index To String',
  shortDesc: 'Choose between multiple strings.',
  category: 'Utilities',
  deprecated: true,
  initialize: function () {
    this._internal.inputs = [];
    this._internal.currentSelectedIndex = 0;
    this._internal.indexChanged = false;
  },
  getInspectInfo() {
    return this._internal.inputs[this._internal.currentSelectedIndex];
  },
  numberedInputs: {
    input: {
      type: 'string',
      displayPrefix: 'String for ',
      group: 'Inputs',
      createSetter: function (index) {
        return function (value) {
          value = value ? value.toString() : '';
          this._internal.inputs[index] = value;
          if (this._internal.currentSelectedIndex === index) {
            this.flagOutputDirty('currentValue');
          }
        };
      }
    }
  },
  inputs: {
    index: {
      type: {
        name: 'number'
      },
      displayName: 'Index',
      default: 0,
      set: function (value) {
        value = value | 0;

        this._internal.currentSelectedIndex = value;
        this.flagOutputDirty('currentValue');
        this.sendSignalOnOutput('indexChanged');
      }
    }
  },
  outputs: {
    currentValue: {
      type: 'string',
      displayName: 'Current Value',
      group: 'Value',
      getter: function () {
        return this._internal.inputs[this._internal.currentSelectedIndex];
      }
    },
    indexChanged: {
      type: 'signal',
      displayName: 'Index Changed',
      group: 'Signals'
    }
  }
};

module.exports = {
  node: StringSelectorNode
};
