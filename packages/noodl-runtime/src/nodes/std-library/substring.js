'use strict';

const SubStringNode = {
  name: 'Substring',
  docs: 'https://docs.noodl.net/nodes/string-manipulation/substring',
  category: 'String Manipulation',
  initialize: function () {
    var internal = this._internal;
    internal.startIndex = 0;
    internal.endIndex = -1;
    internal.cachedResult = '';
    internal.inputString = '';
    internal.resultDirty = false;
  },
  inputs: {
    start: {
      type: 'number',
      displayName: 'Start',
      default: 0,
      set: function (value) {
        this._internal.startIndex = value;
        this._internal.resultDirty = true;
        this.flagOutputDirty('result');
      }
    },
    end: {
      type: 'number',
      displayName: 'End',
      default: 0,
      set: function (value) {
        this._internal.endIndex = value;
        this._internal.resultDirty = true;
        this.flagOutputDirty('result');
      }
    },
    string: {
      type: {
        name: 'string'
      },
      displayName: 'String',
      default: '',
      set: function (value) {
        value = value.toString();
        this._internal.inputString = value;
        this._internal.resultDirty = true;
        this.flagOutputDirty('result');
      }
    }
  },
  outputs: {
    result: {
      type: 'string',
      displayName: 'Result',
      getter: function () {
        var internal = this._internal;

        if (internal.resultDirty) {
          if (internal.endIndex === -1) {
            internal.cachedResult = internal.inputString.substr(internal.startIndex);
          } else {
            internal.cachedResult = internal.inputString.substr(
              internal.startIndex,
              internal.endIndex - internal.startIndex
            );
          }
          internal.resultDirty = false;
        }
        return internal.cachedResult;
      }
    }
  }
};

module.exports = {
  node: SubStringNode
};
