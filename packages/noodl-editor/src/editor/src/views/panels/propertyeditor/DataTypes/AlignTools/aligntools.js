import View from '../../../../../../../shared/view';
import AlignToolsTemplate from '../../../../../templates/propertyeditor/aligntools.html';
import PopupLayer from '../../../../popuplayer';

var AlignTools = function (args) {
  View.call(this);

  this.parent = args.parent;
  this.onUpdate = args.onUpdate;

  this.defaults = args.defaults;
  this.values = args.values;
  this.tooltip = args.tooltip;

  this.isDefault = this.checkIsDefault();

  this.bindModels();
};
AlignTools.prototype = Object.create(View.prototype);

AlignTools.prototype.bindModels = function () {
  this.isVertical = this.parent.model.parameters.flexDirection !== 'row';

  this.parent.model.on('parametersChanged', (args) => {
    this.isVertical = this.parent.model.parameters.flexDirection !== 'row';
  });
};

AlignTools.prototype.dispose = function () {
  this.parent.model.off(this);
};

AlignTools.prototype.render = function () {
  var _this = this;

  // Component inputs will have output ports, and vice versa
  this.el = this.bindView($(AlignToolsTemplate), this);

  var toolTipTimeout;
  this.$('.align-icon').on('click', function () {
    var _el = this;
    clearTimeout(toolTipTimeout);

    var comp = $(_el).attr('data-comp');
    var value = $(_el).attr('data-value');

    if (_this.values[comp] === value) {
      //un-set this value if it's clicked twice
      _this.values[comp] = undefined;
    } else {
      _this.values[comp] = value;
    }

    _this.updateState();
    _this.onUpdate(comp, _this.values[comp]);
  });

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
      _this.updateState();
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

  this.updateState();
};

AlignTools.prototype.checkIsDefault = function () {
  return (
    this.values['horizontal'] === undefined &&
    this.values['vertical'] === undefined &&
    this.values['justify'] === undefined &&
    this.values['align-items'] === undefined &&
    this.values['justify-content'] === undefined
  );
};

AlignTools.prototype.updateState = function () {
  var _this = this;

  this.isDefault = this.checkIsDefault();

  const comps = Object.keys(this.values);
  this.$('.align-icon').each(function () {
    var _el = this;
    var comp = $(_el).attr('data-comp');
    var value = $(_el).attr('data-value');

    $(_el).removeClass('sel').removeClass('def');
    if (_this.values[comp] !== undefined) {
      if (_this.values[comp] === value) $(_el).addClass('sel');
    } else if (_this.defaults[comp] !== undefined) {
      if (_this.defaults[comp] === value) $(_el).addClass('def');
    } else if (comps.includes(comp) === false) {
      //this icon is not part of this port, hide it
      $(_el).hide();
    }
  });
};

export default AlignTools;
