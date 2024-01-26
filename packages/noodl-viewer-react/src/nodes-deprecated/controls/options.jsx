import React, { useEffect, useState } from 'react';

import FontLoader from '../../fontloader';
import guid from '../../guid';
import Layout from '../../layout';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import Utils from './utils';

function Options(props) {
  const [value, setValue] = useState(props.value);

  // Must update value output on both "mount" and when it's changed
  useEffect(() => {
    setValue(props.value);
  }, []);

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  var style = { ...props.style };
  Layout.size(style, props);
  Layout.align(style, props);

  if (props.textStyle !== undefined) {
    // Apply text style
    style = Object.assign({}, props.textStyle, style);
  }

  if (props.boxShadowEnabled) {
    style.boxShadow = `${props.boxShadowInset ? 'inset ' : ''}${props.boxShadowOffsetX} ${props.boxShadowOffsetY} ${
      props.boxShadowBlurRadius
    } ${props.boxShadowSpreadRadius} ${props.boxShadowColor}`;
  }

  // Hide label if there is no selected value, of if value is not in the items array
  const selectedIndex =
    value === undefined || value === ''
      ? -1
      : props.items === undefined
      ? -1
      : props.items.findIndex((i) => i.Value === value);

  const tagProps = { id: props.id, style: style, onClick: props.onClick };

  let className = 'ndl-controls-select';
  if (props.className) className = className + ' ' + props.className;

  return (
    <select
      className={className}
      ref={(el) => {
        if (el) el.selectedIndex = selectedIndex;
      }}
      {...tagProps}
      disabled={!props.enabled}
      value={value}
      {...Utils.controlEvents(props)}
      onChange={(e) => {
        setValue(e.target.value);
        props.valueChanged && props.valueChanged(e.target.value);
      }}
    >
      {props.items !== undefined
        ? props.items.map((i) => (
            <option
              value={i.Value}
              disabled={i.Disabled === 'true' || i.Disabled === true ? true : undefined}
              selected={i.Value === value}
            >
              {i.Label}
            </option>
          ))
        : null}
    </select>
  );
}

var OptionsNode = {
  name: 'Options',
  displayName: 'Options',
  docs: 'https://docs.noodl.net/nodes/visual/options',
  allowChildren: false,
  noodlNodeAsProp: true,
  initialize: function () {
    this._itemsChanged = () => {
      this.forceUpdate();
    };

    this.props.id = this._internal.controlId = 'input-' + guid();
    this.props.enabled = this._internal.enabled = true;

    this.outputPropValues.hoverState = this.outputPropValues.focusState = this.outputPropValues.pressedState = false;

    this.props.valueChanged = (value) => {
      const changed = this._internal.value !== value;
      this._internal.value = value;
      if (changed) {
        this.flagOutputDirty('value');
        this.sendSignalOnOutput('onChange');
      }
    };
  },
  getReactComponent() {
    return Options;
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
    items: {
      type: 'array',
      displayName: 'Items',
      group: 'General',
      set: function (newValue) {
        if (this._internal.items !== newValue && this._internal.items !== undefined) {
          this._internal.items.off('change', this._itemsChanged);
        }
        this._internal.items = newValue;
        this._internal.items.on('change', this._itemsChanged);

        this.props.items = this._internal.items;
      }
    },
    value: {
      type: '*',
      displayName: 'Value',
      group: 'General',
      set: function (value) {
        if (value !== undefined && typeof value !== 'string') {
          if (value.toString !== undefined) value = value.toString();
          else return;
        }

        const changed = value !== this._internal.value;
        this.props.value = this._internal.value = value;

        if (changed) {
          this.forceUpdate();
          this.flagOutputDirty('value');
        }
      }
    },

    // Text style
    textStyle: {
      index: 20,
      type: 'textStyle',
      group: 'Text',
      displayName: 'Text Style',
      default: 'None',
      set(value) {
        this.props.textStyle = this.context.styles.getTextStyle(value);
        this.forceUpdate();
      }
    },
    fontFamily: {
      index: 21,
      type: 'font',
      group: 'Text',
      displayName: 'Font Family',
      set(value) {
        if (value) {
          let family = value;
          if (family.split('.').length > 1) {
            family = family.replace(/\.[^/.]+$/, '');
            family = family.split('/').pop();
          }
          this.setStyle({ fontFamily: family });
        } else {
          this.removeStyle(['fontFamily']);
        }

        if (this.props.textStyle) {
          this.forceUpdate();
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
    value: {
      type: 'string',
      displayName: 'Value',
      group: 'States',
      getter: function () {
        return this._internal.value;
      }
    },
    onChange: {
      type: 'signal',
      displayName: 'Changed',
      group: 'Events'
    }
  },
  inputCss: {
    fontSize: {
      index: 21,
      group: 'Text',
      displayName: 'Font Size',
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      onChange() {
        if (this.props.textStyle) {
          this.forceUpdate();
        }
      }
    },
    color: {
      index: 24,
      group: 'Text',
      displayName: 'Color',
      type: 'color'
    },
    backgroundColor: {
      index: 100,
      displayName: 'Background Color',
      group: 'Style',
      type: 'color',
      default: 'transparent'
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
      default: 0,
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
  inputProps: {
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
  outputProps: {},
  dynamicports: [
    {
      condition: 'boxShadowEnabled = true',
      inputs: [
        'boxShadowOffsetX',
        'boxShadowOffsetY',
        'boxShadowInset',
        'boxShadowBlurRadius',
        'boxShadowSpreadRadius',
        'boxShadowColor'
      ]
    }
  ],
  methods: {}
};

NodeSharedPortDefinitions.addDimensions(OptionsNode, { defaultSizeMode: 'contentSize', contentLabel: 'Content' });
NodeSharedPortDefinitions.addAlignInputs(OptionsNode);
NodeSharedPortDefinitions.addTransformInputs(OptionsNode);
NodeSharedPortDefinitions.addPaddingInputs(OptionsNode);
NodeSharedPortDefinitions.addMarginInputs(OptionsNode);
NodeSharedPortDefinitions.addSharedVisualInputs(OptionsNode);
Utils.addControlEventsAndStates(OptionsNode);

OptionsNode = createNodeFromReactComponent(OptionsNode);
OptionsNode.setup = function (context, graphModel) {
  graphModel.on('nodeAdded.Options', function (node) {
    if (node.parameters.fontFamily && node.parameters.fontFamily.split('.').length > 1) {
      FontLoader.instance.loadFont(node.parameters.fontFamily);
    }
    node.on('parameterUpdated', function (event) {
      if (event.name === 'fontFamily' && event.value) {
        if (event.value.split('.').length > 1) {
          FontLoader.instance.loadFont(event.value);
        }
      }
    });
  });
};

export default OptionsNode;
