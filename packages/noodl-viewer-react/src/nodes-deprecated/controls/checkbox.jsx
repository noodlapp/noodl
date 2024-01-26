import React, { useEffect, useState } from 'react';

import guid from '../../guid';
import Layout from '../../layout';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import Utils from './utils';

function _styleTemplate(_class, props) {
  return `
    .${_class}:checked {
        background-color: ${props.checkedBackgroundColor};
    }  
    `;
}

// --------------------------------------------------------------------------------------
// CheckBox
// --------------------------------------------------------------------------------------
function CheckBox(props) {
  const [checked, setChecked] = useState(props.checked);

  // Report initial values when mounted
  useEffect(() => {
    setChecked(!!props.checked);
  }, []);

  useEffect(() => {
    setChecked(!!props.checked);
  }, [props.checked]);

  var style = { ...props.style };
  Layout.size(style, props);
  Layout.align(style, props);

  if (props.boxShadowEnabled) {
    style.boxShadow = `${props.boxShadowInset ? 'inset ' : ''}${props.boxShadowOffsetX} ${props.boxShadowOffsetY} ${
      props.boxShadowBlurRadius
    } ${props.boxShadowSpreadRadius} ${props.boxShadowColor}`;
  }

  const tagProps = { id: props.id, style: style };

  Utils.updateStylesForClass(
    'ndl-controls-checkbox-' + props._nodeId,
    { checkedBackgroundColor: props.checkedBackgroundColor },
    _styleTemplate
  );

  let className = 'ndl-controls-checkbox-' + props._nodeId + ' ndl-controls-checkbox';
  if (props.className) className = className + ' ' + props.className;

  return (
    <input
      className={className}
      type="checkbox"
      {...tagProps}
      {...Utils.controlEvents(props)}
      checked={checked}
      disabled={!props.enabled}
      onChange={(e) => {
        setChecked(e.target.checked);
        props.checkedChanged && props.checkedChanged(e.target.checked);
      }}
    ></input>
  );
}

var CheckBoxNode = {
  name: 'Checkbox',
  displayName: 'Checkbox',
  docs: 'https://docs.noodl.net/nodes/visual/checkbox',
  allowChildren: false,
  noodlNodeAsProp: true,
  initialize() {
    this.props.sizeMode = 'explicit';
    this.props.id = this._internal.controlId = 'input-' + guid();
    this.props.enabled = this._internal.enabled = true;
    this.props.checked = this._internal.checked = false;
    this.props._nodeId = this.id;

    this.outputPropValues.hoverState = this.outputPropValues.focusState = this.outputPropValues.pressedState = false;

    this.props.checkedChanged = (checked) => {
      const changed = this._internal.checked !== checked;
      this._internal.checked = checked;
      if (changed) {
        this.flagOutputDirty('checked');
        this.sendSignalOnOutput('onChange');
      }
    };
  },
  getReactComponent() {
    return CheckBox;
  },
  inputs: {
    enabled: {
      type: 'boolean',
      displayName: 'Enabled',
      group: 'General',
      default: true,
      set: function (value) {
        value = !!value;
        const changed = value !== this._internal.enabled;
        this.props.enabled = this._internal.enabled = value;

        if (changed) {
          this.forceUpdate();
          this.flagOutputDirty('enabled');
        }
      }
    },
    checked: {
      type: 'boolean',
      displayName: 'Checked',
      group: 'General',
      default: false,
      set: function (value) {
        value = !!value;
        const changed = value !== this._internal.checked;
        this.props.checked = this._internal.checked = value;

        if (changed) {
          this.forceUpdate();
          this.flagOutputDirty('checked');
        }
      }
    }
  },
  outputs: {
    controlId: {
      type: 'string',
      displayName: 'Control Id',
      group: 'General',
      getter: function () {
        return this._internal.controlId;
      }
    },
    enabled: {
      type: 'boolean',
      displayName: 'Enabled',
      group: 'States',
      getter: function () {
        return this._internal.enabled;
      }
    },
    checked: {
      type: 'boolean',
      displayName: 'Checked',
      group: 'States',
      getter: function () {
        return this._internal.checked;
      }
    },
    // Change
    onChange: {
      displayName: 'Changed',
      group: 'Events',
      type: 'signal'
    }
  },
  inputProps: {
    width: {
      index: 11,
      group: 'Dimensions',
      displayName: 'Width',
      type: {
        name: 'number',
        units: ['%', 'px', 'vw'],
        defaultUnit: 'px'
      },
      default: 32
    },
    height: {
      index: 12,
      group: 'Dimensions',
      displayName: 'Height',
      type: {
        name: 'number',
        units: ['%', 'px', 'vh'],
        defaultUnit: 'px'
      },
      default: 32
    },

    // Styles
    checkedBackgroundColor: {
      displayName: 'Background color',
      group: 'Checked Style',
      type: { name: 'color', allowEditOnly: true },
      default: '#000000'
    },

    // Box shadow
    boxShadowEnabled: {
      index: 250,
      group: 'Box Shadow',
      displayName: 'Shadow Enabled',
      type: 'boolean',
      default: false
    },
    boxShadowOffsetX: {
      index: 251,
      group: 'Box Shadow',
      displayName: 'Offset X',
      default: 0,
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      }
    },
    boxShadowOffsetY: {
      index: 252,
      group: 'Box Shadow',
      displayName: 'Offset Y',
      default: 0,
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      }
    },
    boxShadowBlurRadius: {
      index: 253,
      group: 'Box Shadow',
      displayName: 'Blur Radius',
      default: 5,
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      }
    },
    boxShadowSpreadRadius: {
      index: 254,
      group: 'Box Shadow',
      displayName: 'Spread Radius',
      default: 2,
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      }
    },
    boxShadowInset: {
      index: 255,
      group: 'Box Shadow',
      displayName: 'Inset',
      type: 'boolean',
      default: false
    },
    boxShadowColor: {
      index: 256,
      group: 'Box Shadow',
      displayName: 'Shadow Color',
      type: 'color',
      default: 'rgba(0,0,0,0.2)'
    }
  },
  inputCss: {
    backgroundColor: {
      index: 201,
      displayName: 'Background Color',
      group: 'Style',
      type: 'color'
    },

    // Border styles
    borderRadius: {
      index: 202,
      displayName: 'Border Radius',
      group: 'Style',
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      default: 2,
      applyDefault: false
    },
    borderStyle: {
      index: 203,
      displayName: 'Border Style',
      group: 'Style',
      type: {
        name: 'enum',
        enums: [
          { label: 'None', value: 'none' },
          { label: 'Solid', value: 'solid' },
          { label: 'Dotted', value: 'dotted' },
          { label: 'Dashed', value: 'dashed' }
        ]
      },
      default: 'solid',
      applyDefault: false
    },
    borderWidth: {
      index: 204,
      displayName: 'Border Width',
      group: 'Style',
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      default: 1,
      applyDefault: false
    },
    borderColor: {
      index: 205,
      displayName: 'Border Color',
      group: 'Style',
      type: 'color',
      default: '#000000'
    }
  },
  outputProps: {},
  methods: {}
};

NodeSharedPortDefinitions.addAlignInputs(CheckBoxNode);
NodeSharedPortDefinitions.addTransformInputs(CheckBoxNode);
NodeSharedPortDefinitions.addMarginInputs(CheckBoxNode);
NodeSharedPortDefinitions.addSharedVisualInputs(CheckBoxNode);
Utils.addControlEventsAndStates(CheckBoxNode);

CheckBoxNode = createNodeFromReactComponent(CheckBoxNode);
export default CheckBoxNode;
