import View from '../../../../../shared/view';
import MarginPaddingViewTemplate from '../../../templates/propertyeditor/marginpaddingview.html';
import PopupLayer from '../../popuplayer';

var MarginPaddingView = function (args) {
  View.call(this);

  this.onUpdate = args.onUpdate;

  this.defaults = args.defaults;
  this.values = args.values;

  this.isDefault = args.isDefault;
};
MarginPaddingView.prototype = Object.create(View.prototype);

MarginPaddingView.prototype.render = function () {
  var _this = this;

  // Component inputs will have output ports, and vice versa
  this.el = this.bindView($(MarginPaddingViewTemplate), this);

  // Render units dropdown
  this.$('.property-input-dropdown').html('');
  var units = ['px', '%'];
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

  this.$('.property-input-dropdown').on('mousedown', function (event) {
    event.preventDefault(); // make sure drop down doesn't blur input until after "onPropertyChanged" has been triggered
  });

  this.$('.property-number-units').on('blur', function () {
    _this.$('.property-input-dropdown').hide();
  });

  this.$('input')
    .on('click', function (evt) {
      evt.stopPropagation();
    })
    .on('keyup', function (evt) {
      if (evt.keyCode === 13) {
        _this.$('#editbox').hide();
        _this.editInProgress = undefined;
      }
    });

  var dragComp, dragX, dragY, dragStartValue;
  this.$('.drag-handle').on('mousedown', function (e) {
    dragComp = $(this).attr('data-comp');
    dragX = e.pageX;
    dragY = e.pageY;
    var v = _this.values[dragComp] || _this.defaults[dragComp];
    dragStartValue = { value: v.value || 0, unit: v.unit };
  });

  this._onMouseMove = (e) => {
    if (dragComp) {
      var dx = e.pageX - dragX,
        dy = dragY - e.pageY;

      var v = Math.round(dragStartValue.value + (dx + dy) * 0.33);
      this.values[dragComp] = { value: v, unit: dragStartValue.unit };

      this.isDefault = false;
      this.onUpdate && this.onUpdate(dragComp, this.values[dragComp], { drag: true });

      this.updateValues();
    }
  };

  this._onMouseUp = (e) => {
    if (dragComp) {
      this.onUpdate && this.onUpdate(dragComp, this.values[dragComp], { oldValue: dragStartValue });
      dragComp = undefined;
      e.stopPropagation();
    }
  };

  document.addEventListener('mousemove', this._onMouseMove);
  document.addEventListener('mouseup', this._onMouseUp);

  var changedToolTipTimeout;
  this.$('.property-changed-dot')
    .on('click', function () {
      clearTimeout(changedToolTipTimeout);
      Object.keys(_this.defaults).forEach((comp) => {
        if (_this.values[comp] !== undefined) {
          _this.values[comp] = undefined;
          _this.onUpdate(comp, undefined);
        }
      });
      _this.updateValues();
      _this.isDefault = true;
    })
    .on('mouseenter', function () {
      var _el = this;
      changedToolTipTimeout = setTimeout(function () {
        PopupLayer.instance.showTooltip({
          x: $(_el).offset().left + $(_el).outerWidth(),
          y: $(_el).offset().top + $(_el).outerHeight() / 2,
          position: 'right',
          content: 'Reset to default'
        });
      }, 1000);
    })
    .on('mouseleave', function () {
      PopupLayer.instance.hideTooltip();
    });

  this.updateValues();

  return this.el;
};

MarginPaddingView.prototype.dispose = function () {
  document.removeEventListener('mousemove', this._onMouseMove);
  document.removeEventListener('mouseup', this._onMouseUp);
};

MarginPaddingView.prototype.onDropDownClicked = function (scope, el, evt) {
  var showShould = !this.$('.property-input-dropdown').is(':visible');
  if (showShould) {
    this.$('.property-number-units')[0].focus();
    this.$('.property-input-dropdown').show();
  }

  evt.stopPropagation();
};

MarginPaddingView.prototype.onUnitChanged = function (scope, el, evt) {
  var unit = el.attr('data-value');
  this.$('[data-text=unit]').text(unit);

  this.$('.property-input-dropdown').hide();

  this.updateValues();

  evt.stopPropagation();
};

MarginPaddingView.prototype.onPropertyChanged = function (scope, el) {
  this.updateValues();

  this.editInProgress = undefined;
};

MarginPaddingView.prototype.updateValues = function () {
  // Extract values from edit
  if (this.editInProgress) {
    var _value = parseFloat(this.$('input').val());
    var value = isNaN(_value) ? undefined : _value;
    var unit = this.$('[data-text=unit]').text();

    if (value !== undefined) {
      this.values[this.editInProgress] = {
        value: value,
        unit: unit
      };
    } else {
      this.values[this.editInProgress] = undefined;
    }

    this.isDefault = false;
    this.onUpdate && this.onUpdate(this.editInProgress, this.values[this.editInProgress]);
  }

  for (var key in this.defaults) {
    var v = this.values[key] || this.defaults[key];
    var _el = this.$('[data-comp=' + key + ']');

    const value = v.value === undefined ? '-' : v.value;
    _el.text(value + ' ' + v.unit);

    _el.removeClass('changed');
    if (this.values[key] !== undefined) _el.addClass('changed');
  }
};

MarginPaddingView.prototype.onLabelClicked = function (scope, el) {
  this.$('#editbox').show();

  var editBoxWidth = 110;
  var editBoxHeight = 35;

  var containerWidth = this.el.outerWidth();

  var x = $(el).offset().left + $(el).outerWidth() / 2 - this.el.offset().left - editBoxWidth / 2;
  var y = $(el).offset().top + $(el).outerHeight() / 2 - this.el.offset().top - editBoxHeight / 2;

  if (x + editBoxWidth + 2 > containerWidth) x = containerWidth - editBoxWidth - 2;
  if (x < 0) x = 2;

  this.$('#editbox-editor').css({
    top: y + 'px',
    left: x + 'px',
    width: editBoxWidth + 'px',
    height: editBoxHeight + 'px'
  });

  var comp = el.attr('data-comp');
  this.editInProgress = comp;

  var v = this.values[comp] || this.defaults[comp];
  if (this.values[comp]) this.$('input').val(this.values[comp].value);
  else {
    this.$('input').val('');
    this.$('input').attr('placeholder', this.defaults[comp].value);
  }
  this.$('input').focus();
  this.$('[data-text=unit]').text(v.unit);
};

MarginPaddingView.prototype.onHideEditBoxClicked = function (scope, el) {
  this.$('#editbox').hide();
  this.editInProgress = undefined;
};

export default MarginPaddingView;
