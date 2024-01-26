import View from '../../../../../shared/view';
import ResizingViewTemplate from '../../../templates/propertyeditor/resizingview.html';

const keys = ['pinLeft', 'pinRight', 'pinTop', 'pinBottom', 'pinHCenter', 'pinVCenter', 'sizeWidth', 'sizeHeight'];

var ResizingView = function (args) {
  View.call(this);

  const values = args.values || {};
  const defaults = args.defaults || {};

  this.values = {};
  keys.forEach((key) => (this.values[key] = values[key] === undefined ? !!defaults[key] : values[key]));

  this.defaultWidth = defaults.width || { value: 100, unit: '%' };
  this.values.width = values.width;

  this.defaultHeight = defaults.height || { value: 100, unit: '%' };
  this.values.height = values.height;

  this.onUpdate = args.onUpdate;

  this.isDefault = args.values === undefined;

  this.widthUnits = args.widthUnits || ['%', 'px'];
  this.heightUnits = args.heightUnits || ['%', 'px'];
};
ResizingView.prototype = Object.create(View.prototype);

ResizingView.prototype.render = function () {
  // Component inputs will have output ports, and vice versa
  this.el = this.bindView($(ResizingViewTemplate), this);

  this.wInput = new ResizingView.DimInput({
    parent: this,
    label: 'W',
    default: this.defaultWidth,
    value: this.values.width,
    units: this.widthUnits,
    isDefault: this.isDefault,
    onUpdate: (value) => {
      this.values.width = value;
      this.updateValues();
    }
  });
  this.$('.dims').append(this.wInput.render());

  this.hInput = new ResizingView.DimInput({
    parent: this,
    label: 'H',
    default: this.defaultHeight,
    value: this.values.height,
    units: this.heightUnits,
    isDefault: this.isDefault,
    onUpdate: (value) => {
      this.values.height = value;
      this.updateValues();
    }
  });
  this.$('.dims').append(this.hInput.render());

  this.constrainValues();
  this.updateView();

  return this.el;
};

ResizingView.prototype.updateView = function () {
  var _values = {};
  keys.forEach((key) => {
    if (!this.modes[key]) _values[key] = 'disabled';
    else _values[key] = this.values[key] ? 'sel' : undefined;
  });
  this._values = _values;

  keys.forEach((key) => {
    this.$('[data-pin=' + key + ']')
      .removeClass('sel')
      .removeClass('disabled');
    if (this._values[key]) this.$('[data-pin=' + key + ']').addClass(this._values[key]);
  });
};

ResizingView.prototype.updateValues = function () {
  var values = {};
  keys.forEach((key) => {
    values[key] = this._values[key] === 'sel';
  });

  values.width = this.values.width || this.defaultWidth;
  values.height = this.values.height || this.defaultHeight;

  this.hInput.isDefault = this.wInput.isDefault = false;

  this.onUpdate(values, { oldValue: this.values });
};

ResizingView.prototype.constrainValues = function () {
  var values = this.values;
  var modes = (this.modes = {
    pinLeft: true,
    pinRight: true,
    pinTop: true,
    pinBottom: true,
    pinHCenter: true,
    pinVCenter: true,
    sizeHeight: true,
    sizeWidth: true
  });

  //if(!values.pinRight && !values.pinLeft && !values.pinHCenter) values.pinLeft = true;

  if (values.pinLeft || values.pinRight) modes.pinHCenter = false;
  if (values.pinLeft && values.pinRight) modes.sizeWidth = false;
  else if (values.pinHCenter) {
    modes.pinRight = false;
    modes.pinLeft = false;
  } else if (values.pinLeft && values.sizeWidth) modes.pinRight = false;
  else if (values.pinRight && values.sizeWidth) modes.pinLeft = false;

  //if(!values.pinTop && !values.pinBottom && !values.pinVCenter) values.pinTop = true;

  if (values.pinTop || values.pinBottom) modes.pinVCenter = false;
  if (values.pinTop && values.pinBottom) modes.sizeHeight = false;
  else if (values.pinVCenter) {
    modes.pinTop = false;
    modes.pinBottom = false;
  } else if (values.pinTop && values.sizeHeight) modes.pinBottom = false;
  else if (values.pinBottom && values.sizeHeight) modes.pinTop = false;

  this.wInput.setVisible(modes.sizeWidth && values.sizeWidth);

  this.hInput.setVisible(modes.sizeHeight && values.sizeHeight);
};

ResizingView.prototype.onPinClicked = function (scope, el, evt) {
  var pin = el.attr('data-pin');

  if (this._values[pin] === 'disabled') return;

  this.values[pin] = !this.values[pin];

  this.constrainValues();
  this.updateView();

  this.updateValues();
};

ResizingView.DimInput = function (args) {
  View.call(this);

  this.el = args.el;
  this.default = args.default;
  this.value = args.value !== undefined ? args.value.value : this.default.value;
  this.unit = args.value !== undefined ? args.value.unit : this.default.unit;
  this.parent = args.parent;
  this.label = args.label;
  this.isDefault = args.isDefault;
  this.units = args.units;

  this.onUpdate = args.onUpdate;
};
ResizingView.DimInput.prototype = Object.create(View.prototype);

ResizingView.DimInput.prototype.render = function () {
  this.el = this.bindView(this.parent.cloneTemplate('dim-input'), this);

  // Render units dropdown
  this.$('.property-input-dropdown').html('');
  var units = this.units;
  for (var i in units) {
    this.$('.property-input-dropdown').append(
      this.bindView(
        $(
          '<div class="property-number-unit-enum" data-click="onUnitChanged" data-value="' +
            units[i] +
            '">' +
            units[i] +
            '</div>'
        )
      )
    );
  }

  this.$('input')
    .on('focus', function () {
      $(this).addClass('property-input-focused');
    })
    .on('blur', function () {
      $(this).removeClass('property-input-focused');
    });

  return this.el;
};

ResizingView.DimInput.prototype.setVisible = function (visible) {
  if (visible) this.el.show();
  else this.el.hide();
};

ResizingView.DimInput.prototype.onDropDownClicked = function (scope, el, evt) {
  var showShould = !this.$('.property-input-dropdown').is(':visible');
  if (showShould) {
    this.$('.property-number-units')[0].focus();
    this.$('.property-input-dropdown').show();
  }

  evt.stopPropagation();
};

ResizingView.DimInput.prototype.updateValue = function () {
  var _value = parseFloat(this.$('input').val());
  var value = isNaN(_value) ? undefined : _value;

  var unit = this.$('[data-text=unit]').text();

  // If the input is not a valid value, then set undefined
  if (value !== undefined) {
    this.onUpdate({ value: value, unit: unit });
    this.isDefault = false;
  } else {
    this.onUpdate(undefined);
    this.value = this.default.value;
    this.$('input').val(this.value);
    this.unit = this.default.unit;
    this.$('[data-text=unit]').text(this.unit);
  }
};

ResizingView.DimInput.prototype.onUnitChanged = function (scope, el, evt) {
  var unit = el.attr('data-value');
  this.$('[data-text=unit]').text(unit);

  this.$('.property-input-dropdown').hide();

  this.updateValue();

  evt.stopPropagation();
};

ResizingView.DimInput.prototype.onPropertyChanged = function (scope, el) {
  this.updateValue();

  el.blur();
};

/*
MarginPaddingView.prototype.updateValues = function() {
  // Extract values from edit
  if(this.editInProgress) {
    var _value = parseFloat(this.$('input').val());
    var value = isNaN(_value)?undefined:_value;
    var unit = this.$('[data-text=unit]').text();

    if(value !== undefined) {
      this.values[this.editInProgress] = {
        value:value,
        unit:unit
      }
    }
    else {
      this.values[this.editInProgress] = undefined;
    }

    this.onUpdate&&this.onUpdate(this.editInProgress,this.values[this.editInProgress]);
  }

  for(var key in this.defaults) {
    var v = this.values[key] || this.defaults[key];
    this.$('[data-comp=' + key + ']').text(v.value + ' ' + v.unit);
  }
}

MarginPaddingView.prototype.onLabelClicked = function(scope,el) {
  this.$('#editbox').show();

  var editBoxWidth = 110;
  var editBoxHeight = 35;

  var containerWidth = this.el.outerWidth();

  var x = $(el).offset().left + $(el).outerWidth()/2 - this.el.offset().left - editBoxWidth/2;
  var y = $(el).offset().top + $(el).outerHeight()/2 - this.el.offset().top - editBoxHeight/2;

  if(x+editBoxWidth+2 > containerWidth) x = containerWidth - editBoxWidth - 2;
  if(x < 0) x = 2;

  this.$('#editbox-editor').css({
    top:y + 'px',
    left:x + 'px',
    width:editBoxWidth + 'px',
    height:editBoxHeight + 'px',
  });

  var comp = el.attr('data-comp');
  this.editInProgress = comp;

  var v = this.values[comp] || this.defaults[comp];
  if(this.values[comp]) this.$('input').val(this.values[comp].value);
  else {
    this.$('input').val('');
    this.$('input').attr('placeholder',this.defaults[comp].value);
  }
  this.$('input').focus();
  this.$('[data-text=unit]').text(v.unit);
}

MarginPaddingView.prototype.onHideEditBoxClicked = function(scope,el) {
  this.$('#editbox').hide();
  this.editInProgress = undefined;

}*/

export default ResizingView;
