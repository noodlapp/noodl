import iro from '@jaames/iro';

import View from '../../../../../../../shared/view';
import ColorPickerTemplate from '../../../../../templates/propertyeditor/colorpicker.html';

function colorToHex(color) {
  const hex = color.alpha === 1 ? color.hexString : color.hex8String;
  return hex.toUpperCase();
}
function ColorPicker() {
  this.onColorChanged = (color) => {
    this._setInputFieldsToColor(color);
  };

  this.onInputMove = (color) => {
    this.colorChangedListener && this.colorChangedListener(colorToHex(color), false);
  };

  this.onInputEnd = (color) => {
    this.colorChangedListener && this.colorChangedListener(colorToHex(color), true);
  };

  this.onColorInit = (color) => this._setInputFieldsToColor(color);
}

ColorPicker.prototype = Object.create(View.prototype);

ColorPicker.prototype.dispose = function () {
  this.colorChangedListener = undefined;
  this.colorPicker.off('color:change', this.onColorChanged);
  this.colorPicker.off('color:init', this.onColorInit);
  this.colorPicker.off('input:move', this.onInputMove);
  this.colorPicker.off('input:end', this.onInputEnd);
};

ColorPicker.prototype.render = function () {
  this.el = this.bindView($(ColorPickerTemplate), this);

  const pickerDiv = this.$('#ui-color-picker')[0];

  this.colorPicker = new iro.ColorPicker(pickerDiv, {
    width: 212,
    margin: 16,
    padding: 0,
    layout: [
      {
        component: iro.ui.Box
      },
      {
        component: iro.ui.Slider,
        options: { sliderType: 'hue' }
      },
      {
        component: iro.ui.Slider,
        options: { sliderType: 'alpha' }
      }
    ]
  });

  this.$('.IroBox').css({ 'border-radius': 0 }); //override the css style to remove the default corner radius

  this.colorPicker.on('color:change', this.onColorChanged);
  this.colorPicker.on('color:init', this.onColorInit);
  this.colorPicker.on('input:move', this.onInputMove);
  this.colorPicker.on('input:end', this.onInputEnd);

  this.$('#opacityInput').on('click', () => {
    this.$('#opacityInput').select();
  });

  this.$('#hexinput').on('click', () => {
    this.$('#hexinput').select();
  });
};

ColorPicker.prototype._setInputFieldsToColor = function (color) {
  this.$('#hexinput').val(color.hexString.toUpperCase());

  if (color.alpha === 1) {
    this.$('#opacityInput').val('');
  } else {
    this.$('#opacityInput').val(Math.floor(color.alpha * 100) + '%');
  }
};

ColorPicker.prototype.onHexInputFieldChanged = function (scope, el, event) {
  let color = event.target.value.toUpperCase();

  const isValid = /(^#{0,1}[0-9A-F]{6}$)|(^#{0,1}[0-9A-F]{3}$)/i.test(color);

  if (isValid) {
    if (color[0] !== '#') color = '#' + color;

    this.colorPicker.color.set(color);
    this.colorChangedListener && this.colorChangedListener(colorToHex(this.colorPicker.color), true);
  }

  //set fields again with the correct format
  this._setInputFieldsToColor(this.colorPicker.color);
  this.$('#hexinput').blur();
};

ColorPicker.prototype.onOpacityInputFieldChanged = function (scope, el, event) {
  let opacity = event.target.value.trim().replace('%', '');

  const isValid = !isNaN(opacity) && !isNaN(parseFloat(opacity));
  if (isValid) {
    this.colorPicker.color.alpha = opacity / 100;
    this.colorChangedListener && this.colorChangedListener(colorToHex(this.colorPicker.color), true);
  }

  this.$('#opacityInput').blur();
};

ColorPicker.prototype.setColorChangedListener = function (cb) {
  this.colorChangedListener = cb;
};

ColorPicker.prototype.setColor = function (color) {
  this.colorPicker.color.set(color || '#000000');
};

export default ColorPicker;
