import React from 'react';
import ReactDOM from 'react-dom';

import { ProjectModel } from '@noodl-models/projectmodel';

import { EventDispatcher } from '../../../../../../../shared/utils/EventDispatcher';
import { TypeView } from '../../TypeView';
import { getEditType } from '../../utils';
import ColorPicker from './colorpicker';
import ColorStylePicker from './colorstylepicker';

//Note: this entire property can be re-created by events such as todo
//so the color picker can be left open, but now need a new callback to set
//values on the new property.
let colorPicker;

//The property panel might rerender, and recreate all the PropertyEditors, while the Color Picker is open.
//When this happens, the color picker need new callbacks to update the new DOM elements that are attached to the new view
//this function handles that and is called whenever a PropertyEditor.ColorType is re-rendered when the color picker is active
function bindColorPickerToView(view) {
  const initialColor = view.getCurrentValue();

  colorPicker.setColor(ProjectModel.instance.resolveColor(initialColor.value));
  colorPicker.setColorChangedListener((color, commit) => {
    //commit is true when the value should be added to the undo queue
    view.parent.setParameterEx(view.name, color, initialColor.value, !commit);
    view.updateCurrentValue();
  });

  colorPicker._propertyName = view.name;
}

export class ColorType extends TypeView {
  propertyName: TSFixme;
  el: TSFixme;

  static fromPort(args) {
    const view = new ColorType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.displayName = p.displayName ? p.displayName : p.name;
    view.name = p.name;
    view.type = getEditType(p);
    view.group = p.group;
    view.value = parent.model.getParameter(p.name);
    view.parent = parent;
    view.isConnected = parent.model.isPortConnected(p.name, 'target');
    view.isDefault = parent.model.parameters[p.name] === undefined;

    return view;
  }
  dispose() {
    TypeView.prototype.dispose.call(this);

    EventDispatcher.instance.off(this);

    if (colorPicker) {
      colorPicker.dispose();
      colorPicker = null;
    }
  }
  onLaunchClicked(scope, el, evt) {
    this.propertyName = scope.name;

    if (!colorPicker) {
      colorPicker = new ColorPicker();
      colorPicker.render();
    }

    bindColorPickerToView(this);

    this.parent.showPopout({
      content: colorPicker,
      attachTo: el,
      position: 'right',
      onClose: () => {
        colorPicker && colorPicker.dispose();
        colorPicker = null;
      }
    });

    evt.stopPropagation();
  }
  render() {
    this.el = this.bindView(this.parent.cloneTemplate('color'), this);
    TypeView.prototype.render.call(this);

    this.updateCurrentValue();

    if (colorPicker && colorPicker._propertyName === this.name) {
      bindColorPickerToView(this);
    }

    let colorStylePickerDiv;
    const props = {};
    let isShowingColorStylePicker = false;

    EventDispatcher.instance.on(
      'Model.stylesChanged',
      (event) => {
        if (event.args.type === 'colors') {
          this.updateCurrentValue();
        }
      },
      this
    );

    this.$('input').on('focus', (e) => {
      e.stopPropagation();
    });

    this.$('input').on('click', (e) => {
      // @ts-expect-error
      delete props.filter; //delete filter in case the user opens/closes multiple times

      // @ts-expect-error
      props.onItemSelected = (name) => {
        this.parent.setParameter(this.name, name);
        this.updateCurrentValue();
        this.parent.hidePopout();
      };

      const current = this.getCurrentValue();
      // @ts-expect-error
      props.inputValue = current.value;

      colorStylePickerDiv = document.createElement('div');
      ReactDOM.render(React.createElement(ColorStylePicker, props), colorStylePickerDiv);

      this.parent.showPopout({
        content: { el: $(colorStylePickerDiv) },
        attachTo: this.el,
        position: 'right',
        onClose: () => {
          ReactDOM.unmountComponentAtNode(colorStylePickerDiv);
          isShowingColorStylePicker = false;
        }
      });
      isShowingColorStylePicker = true;

      e.stopPropagation(); // Stop propagation, otherwise the popup will close
    });

    this.$('input').on('keyup', (e) => {
      if (!isShowingColorStylePicker) {
        return;
      }
      if (e.key === 'Enter') {
        this.parent.hidePopout();
      } else {
        // @ts-expect-error
        props.filter = e.target.value;
        ReactDOM.render(React.createElement(ColorStylePicker, props), colorStylePickerDiv);
      }
    });

    return this.el;
  }
  updateCurrentValue() {
    const current = this.getCurrentValue();

    let stringColor = current.value;

    if (stringColor && stringColor[0] === '#') {
      //only display the RGB part of a color in the input field
      //so if the colors has a #RRGGBBAA format, strip away the alpha
      const hasAlpha = stringColor.length === 9;
      stringColor = hasAlpha ? stringColor.slice(0, 7) : stringColor;
      stringColor = stringColor.toUpperCase();
    }

    this.$('#stringInput').val(stringColor);
    this.$('.color-thumbnail-content').css({
      'background-color': ProjectModel.instance.resolveColor(current.value)
    });
    this.isDefault = current.isDefault;
  }
  onStringInputChanged(scope, el) {
    let value = this.$('#stringInput').val().trim();
    if (value === '') value = undefined;

    const isHex = value !== undefined && /[0-9A-F]{6}$/i.test(value);
    if (isHex === true && value[0] !== '#') {
      value = '#' + value;
    }

    this.parent.setParameter(this.name, value);
    this.updateCurrentValue();
  }
  resetToDefault() {
    this.updateCurrentValue();
  }
}
