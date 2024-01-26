import React from 'react';
import ReactDOM from 'react-dom';

import { NodeLibrary } from '@noodl-models/nodelibrary';
import { StylesModel } from '@noodl-models/StylesModel';
import { UndoQueue } from '@noodl-models/undo-queue-model';

import { EventDispatcher } from '../../../../../../shared/utils/EventDispatcher';
import TextStylePicker from '../../../TextStylePicker/TextStylePicker';
import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

function firstType(type) {
  return NodeLibrary.nameForPortType(type);
}

export class TextStyleType extends TypeView {
  el: TSFixme;

  static fromPort(args) {
    const view = new TextStyleType();

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
  }

  render() {
    this.el = this.bindView(this.parent.cloneTemplate(firstType(this.type)), this);
    TypeView.prototype.render.call(this);

    EventDispatcher.instance.on(
      'Model.stylesChanged',
      (event) => {
        if (event.args.type === 'text') {
          this.resetToDefault();
        }
      },
      this
    );

    let textStylePickerDiv;

    const props = {};

    this.$('input').on('focus', (e) => {
      e.stopPropagation();
    });

    this.$('input').on('click', (e) => {
      // @ts-expect-error
      delete props.filter; //delete filter in case the user opens/closes multiple times

      const newStyleProps = {};

      if (this.port.type.childPorts) {
        const prefix = this.port.type.childPortPrefix;
        for (const childPort of this.port.type.childPorts) {
          const value = this.parent.model.getParameter(prefix + childPort);
          if (value !== undefined) {
            newStyleProps[childPort] = value;
          }
        }
      }

      // @ts-expect-error
      props.newStyleProps = newStyleProps;
      // @ts-expect-error
      props.selectedStyle = this.getCurrentValue().value;

      // @ts-expect-error
      props.onItemSelected = (name) => {
        this.$('input').val(name);
        this.$('input').trigger('change');

        this.parent.hidePopout();
      };

      // @ts-expect-error
      props.createNewStyle = (styleName, newStyle) => {
        this.parent.hidePopout();

        //reset the values that are now moved to the text style
        const prevValue = this.parent.model.parameters[this.name];
        const portValuesToReset = {};

        if (this.port.type.childPorts) {
          const prefix = this.port.type.childPortPrefix;
          for (const childPort of this.port.type.childPorts) {
            const value = this.parent.model.parameters[prefix + childPort];
            if (value !== undefined) {
              portValuesToReset[prefix + childPort] = value;
            }
          }
        }

        const portsToReset = Object.keys(portValuesToReset);

        // @ts-expect-error
        UndoQueue.instance.pushAndDo({
          label: `create new text style: ${styleName}`,
          do: () => {
            const stylesModel = new StylesModel();
            stylesModel.setStyle('text', styleName, newStyle);
            stylesModel.dispose();

            //Set the new text style
            this.parent.model.setParameter(this.name, styleName === '' ? undefined : styleName, { undo: false });

            if (portsToReset.length) {
              for (const portName of portsToReset) {
                this.parent.model.setParameter(portName, undefined, { undo: false });
              }

              //the ports have changed values so we need to re-render the ports
              //this will reset any bound popouts, which causes some minor UX issues
              this.parent._portsHash = undefined;
              this.parent.renderGroups();
            }

            this._valueUpdated();
          },
          undo: () => {
            const stylesModel = new StylesModel();
            stylesModel.deleteStyle('text', styleName);
            stylesModel.dispose();

            this.parent.model.setParameter(this.name, prevValue === '' ? undefined : prevValue, { undo: false });

            if (portsToReset.length) {
              for (const portName of portsToReset) {
                this.parent.model.setParameter(portName, portValuesToReset[portName], { undo: false });
              }

              //the ports have changed values so we need to re-render the ports
              //this will reset any bound popouts, which causes some minor UX issues
              this.parent._portsHash = undefined;
              this.parent.renderGroups();
            }

            this._valueUpdated();
          }
        });
      };

      // @ts-expect-error
      props.inputValue = this.$('input').val();

      textStylePickerDiv = document.createElement('div');
      ReactDOM.render(React.createElement(TextStylePicker, props), textStylePickerDiv);

      this.parent.showPopout({
        content: { el: $(textStylePickerDiv) },
        attachTo: this.el,
        position: 'right',
        onClose: () => {
          if (textStylePickerDiv) {
            ReactDOM.unmountComponentAtNode(textStylePickerDiv);
            textStylePickerDiv = undefined;
          }
        }
      });

      e.stopPropagation(); // Stop propagation, otherwise the popup will close
    });

    this.$('input').on('keyup', (e) => {
      if (!textStylePickerDiv) {
        return;
      }

      if (e.key === 'Enter') {
        this.parent.hidePopout();
      } else {
        // @ts-expect-error
        props.filter = e.target.value;
        ReactDOM.render(React.createElement(TextStylePicker, props), textStylePickerDiv);
      }
    });

    return this.el;
  }
  _valueUpdated() {
    const el = this.$('input');

    // Update current value and if it is default or not
    const current = this.getCurrentValue();
    el.val(current.value);
    this.isDefault = current.isDefault;

    //and update the child ports since their default values have changed
    if (this.parent.views && this.port.type.childPorts) {
      const prefix = this.port.type.childPortPrefix;
      for (const childPort of this.port.type.childPorts) {
        const portName = prefix + childPort;
        for (const portView of this.parent.views) {
          if (portView.isDefault && portView.port && portView.port.name === portName) {
            //resetToDefault actually doesn't reset, it just updates the value in the DOM to the current value from the model
            portView.resetToDefault && portView.resetToDefault();
          }
        }
      }
    }
  }
  onPropertyChanged(scope, el) {
    this.parent.setParameter(scope.name, el.val() === '' ? undefined : el.val());
    el.blur();

    this._valueUpdated();
  }
}
