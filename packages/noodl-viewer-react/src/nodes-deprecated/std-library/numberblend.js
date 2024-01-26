'use strict';

const EaseCurves = require('../../easecurves');

const NumberBlend = {
  name: 'Number Blend',
  docs: 'https://docs.noodl.net/nodes/interpolation/number-blend',
  shortDesc: 'Computes a result output based on blending (linearly interpolating) between the inputs.',
  category: 'Interpolation',
  deprecated: true,
  initialize: function () {
    var internal = this._internal;
    internal.inputs = [];
    internal.blendValue = 0;
    internal.result = 0;
    internal.clamp = false;
  },
  getInspectInfo() {
    return this._internal.result;
  },
  prototypeExtensions: {
    updateResult: function () {
      var inputs = this._internal.inputs;

      if (inputs.length === 0) {
        return 0;
      }

      var index = Math.floor(this._internal.blendValue),
        t = this._internal.blendValue - index;

      if (index >= inputs.length - 1) {
        if (this._internal.clamp) {
          index = inputs.length - 1;
          t = 0;
        } else {
          t += index - (inputs.length - 1);
          index = inputs.length - 1;
        }
      } else if (index <= 0) {
        if (this._internal.clamp) {
          index = 0;
          t = 0;
        } else {
          t += index;
          index = 0;
        }
      }

      if (t === 0 || inputs.length === 1) {
        this._internal.result = inputs[index];
      } else if (index === inputs.length - 1 && t > 0) {
        this._internal.result = EaseCurves.linear(inputs[index - 1], inputs[index], t + 1);
      } else {
        this._internal.result = EaseCurves.linear(inputs[index], inputs[index + 1], t);
      }

      this.flagOutputDirty('result');
    }
  },
  numberedInputs: {
    input: {
      type: 'number',
      displayPrefix: 'Number',
      createSetter(index) {
        return function (value) {
          const inputs = this._internal.inputs;

          if (inputs[index] === value) {
            return;
          }

          inputs[index] = value || 0;
          this.updateResult();
        };
      }
    }
  },
  inputs: {
    blendValue: {
      type: 'number',
      displayName: 'Blend Value',
      default: 0,
      set: function (value) {
        this._internal.blendValue = value;
        this.updateResult();
      }
    },
    clamp: {
      type: 'boolean',
      displayName: 'Clamp',
      default: false,
      set: function (value) {
        this._internal.clamp = value ? true : false;
        this.updateResult();
      }
    }
  },
  outputs: {
    result: {
      type: 'number',
      displayName: 'Result',
      getter: function () {
        return this._internal.result;
      }
    }
  }
};

module.exports = {
  node: NumberBlend
};
