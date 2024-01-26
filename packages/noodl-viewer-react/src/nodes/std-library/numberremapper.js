'use strict';

const NumberRemapperNode = {
  name: 'Number Remapper',
  docs: 'https://docs.noodl.net/nodes/math/number-remapper',
  category: 'Math',
  initialize: function () {
    var internal = this._internal;
    internal._currentInputValue = 0;
    internal._remappedValue = 0;
    internal._minInputValue = 0;
    internal._maxInputValue = 0;
    internal._minOutputValue = 0;
    internal._maxOutputValue = 1;
    internal._clampOutput = true;
  },
  getInspectInfo() {
    return this._internal._remappedValue;
  },
  inputs: {
    inputValue: {
      group: 'Value to Remap',
      type: {
        name: 'number',
        allowConnectionOnly: true
      },
      default: 0,
      displayName: 'Input Value',
      set: function (value) {
        this._internal._currentInputValue = value;
        this._calculateNewOutputValue();
      }
    },
    minInputValue: {
      group: 'Input Parameters',
      type: {
        name: 'number'
      },
      default: 0,
      displayName: 'Input Minimum',
      set: function (value) {
        this._internal._minInputValue = value;
        this._calculateNewOutputValue();
      }
    },
    maxInputValue: {
      group: 'Input Parameters',
      type: {
        name: 'number'
      },
      default: 0,
      displayName: 'Input Maximum',
      set: function (value) {
        this._internal._maxInputValue = value;
        this._calculateNewOutputValue();
      }
    },
    minOutputValue: {
      group: 'Output Parameters',
      type: {
        name: 'number'
      },
      default: 0,
      displayName: 'Output Minimum',
      set: function (value) {
        this._internal._minOutputValue = value;
        this._calculateNewOutputValue();
      }
    },
    maxOutputValue: {
      group: 'Output Parameters',
      type: {
        name: 'number'
      },
      default: 1,
      displayName: 'Output Maximum',
      set: function (value) {
        this._internal._maxOutputValue = value;
        this._calculateNewOutputValue();
      }
    },
    clamp: {
      group: 'Output Parameters',
      type: {
        name: 'boolean',
        allowEditOnly: true
      },
      default: true,
      displayName: 'Clamp Output',
      set: function (value) {
        this._internal._clampOutput = value ? true : false;
        this._calculateNewOutputValue();
      }
    }
  },
  outputs: {
    remappedValue: {
      type: 'number',
      displayName: 'Remapped Value',
      group: 'Outputs',
      getter: function () {
        return this._internal._remappedValue;
      }
    }
  },
  prototypeExtensions: {
    _calculateNewOutputValue: {
      value: function () {
        var normalizedValue,
          _internal = this._internal;

        if (_internal._maxInputValue === _internal._minInputValue) {
          normalizedValue = 0;
        } else {
          normalizedValue =
            (_internal._currentInputValue - _internal._minInputValue) /
            (_internal._maxInputValue - _internal._minInputValue);
        }

        if (_internal._clampOutput) {
          normalizedValue = Math.max(0, Math.min(1, normalizedValue));
        }
        _internal._remappedValue =
          _internal._minOutputValue + normalizedValue * (_internal._maxOutputValue - _internal._minOutputValue);
        this.flagOutputDirty('remappedValue');
      }
    }
  }
};

module.exports = {
  node: NumberRemapperNode
};
