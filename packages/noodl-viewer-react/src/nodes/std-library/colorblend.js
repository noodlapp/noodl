'use strict';

const EaseCurves = require('../../easecurves');

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function setRGB(result, hex) {
  for (var i = 0; i < 3; ++i) {
    var index = 1 + i * 2;
    result[i] = parseInt(hex.substring(index, index + 2), 16);
  }
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(rgb) {
  return '#' + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

//reusing these to reduce GC pressure
let rgb0 = [0, 0, 0];
let rgb1 = [0, 0, 0];
let rgb2 = [0, 0, 0];

const ColorBlendNode = {
  name: 'Color Blend',
  docs: 'https://docs.noodl.net/nodes/utilities/color-blend',
  shortDesc:
    'Given any number of input colors this node can interpolate between these and give the result color as output.',
  category: 'Interpolation',
  getInspectInfo() {
    return [{ type: 'color', value: this._internal.resultColor }];
  },
  initialize() {
    const internal = this._internal;

    internal.resultColor = '#000000';
    internal.blendValue = 0;
    internal.colors = [];
  },
  numberedInputs: {
    color: {
      type: 'color',
      displayPrefix: 'Color',
      createSetter(index) {
        return function (value) {
          this._internal.colors[index] = value;
          this.updateColor();
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
        this.updateColor();
      }
    }
  },
  outputs: {
    result: {
      type: 'color',
      displayName: 'Result',
      getter: function () {
        return this._internal.resultColor;
      }
    }
  },
  methods: {
    updateColor() {
      var colors = this._internal.colors;
      if (colors.length === 0) {
        return;
      }

      function getColor(index) {
        return colors[index] ? colors[index] : '#000000';
      }

      var clampedBlendValue = clamp(0, colors.length - 1, this._internal.blendValue);
      var index = Math.floor(clampedBlendValue);
      var t = clampedBlendValue - index;

      if (t === 0) {
        this._internal.resultColor = getColor(index);
      } else {
        setRGB(rgb0, getColor(index));
        setRGB(rgb1, getColor(index + 1));

        rgb2[0] = Math.floor(EaseCurves.linear(rgb0[0], rgb1[0], t));
        rgb2[1] = Math.floor(EaseCurves.linear(rgb0[1], rgb1[1], t));
        rgb2[2] = Math.floor(EaseCurves.linear(rgb0[2], rgb1[2], t));
        this._internal.resultColor = rgbToHex(rgb2);
      }

      this.flagOutputDirty('result');
    }
  }
};

module.exports = {
  node: ColorBlendNode
};
