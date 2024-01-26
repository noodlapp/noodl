import { EventDispatcher } from '../../../../../shared/utils/EventDispatcher';
import View from '../../../../../shared/view';
import PopupLayer from '../../popuplayer';

export class TypeView extends View {
  constructor() {
    super();
  }

  dispose() {
    EventDispatcher.instance.off(this);
  }

  render() {
    var _this = this;

    //check if we have a "parentPorts". If it does, it means the default value is derived
    //from a style, and we need to update when the style updates
    if (this.parent.model && this.parent.model.model) {
      EventDispatcher.instance.off(this); //safeguard agains multiple renders
      const port = this.parent.model.model.getPort(this.name);
      if (port.type.parentPort) {
        EventDispatcher.instance.on(
          'ProjectModel.metadataChanged',
          ({ key }) => {
            //only need to update if we're at the default value
            if (key === 'styles' && this.isDefault) {
              this.resetToDefault();
            }
          },
          this
        );
      }
    }

    var el = this.el.find('.property-input-connected');
    el.on('mouseenter', function () {
      PopupLayer.instance.showTooltip({
        x: $(this).offset().left + $(this).outerWidth(),
        y: $(this).offset().top + $(this).outerHeight() / 2,
        position: 'right',
        content: 'This port is connected and the specified value is likely overwritten.'
      });
    }).on('mouseleave', function () {
      PopupLayer.instance.hideTooltip();
    });

    this.$('input')
      .on('focus', function () {
        $(this).addClass('property-input-focused');
      })
      .on('blur', function () {
        $(this).removeClass('property-input-focused');
      });

    var toolTipTimeout;
    this.$('.property-changed-dot')
      .on('click', function () {
        clearTimeout(toolTipTimeout);
        _this.parent.model.setParameter(_this.name, undefined, {
          undo: true,
          label: 'reset parameter'
        });
        _this.isDefault = true;
        _this.resetToDefault();
      })
      .on('mouseenter', function () {
        var _el = this;
        toolTipTimeout = setTimeout(function () {
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
  }

  getCurrentValue(name) {
    var _name = name === undefined ? this.name : name;

    if (this.parent.model.hasParameter && !this.parent.model.hasParameter(_name)) {
      // Happens for dynamic port sometimes
      return '';
    }

    return {
      value: this.parent.model.getParameter(_name),
      isDefault: this.parent.model.parameters[_name] === undefined
    };
  }

  resetToDefault() {
    this.$('input').val(this.getCurrentValue().value);
  }
}
