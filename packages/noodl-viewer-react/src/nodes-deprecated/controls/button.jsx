import React, { useEffect } from 'react';

import FontLoader from '../../fontloader';
import guid from '../../guid';
import Layout from '../../layout';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import Utils from './utils';

// --------------------------------------------------------------------------------------
// Button
// --------------------------------------------------------------------------------------
function Button(props) {
  // On mount
  useEffect(() => {
    props.focusChanged && props.focusChanged(false);
    props.hoverChanged && props.hoverChanged(false);
    props.pressedChanged && props.pressedChanged(false);
  }, []);

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

  let className = 'ndl-controls-button';
  if (props.className) className = className + ' ' + props.className;

  return (
    <button
      className={className}
      disabled={!props.enabled}
      {...Utils.controlEvents(props)}
      type={props.buttonType}
      style={style}
      onClick={props.onClick}
    >
      {props.label}
      {props.children}
    </button>
  );
}

var ButtonNode = {
  name: 'Button',
  docs: 'https://docs.noodl.net/nodes/visual/button',
  allowChildren: true,
  noodlNodeAsProp: true,
  initialize() {
    this.outputPropValues.hoverState = this.outputPropValues.focusState = this.outputPropValues.pressedState = false;
    this.props.id = this._internal.controlId = 'input-' + guid();
    this.props.enabled = this._internal.enabled = true;
  },
  getReactComponent() {
    return Button;
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
    /*  textAlignX: {
            group: 'Text Alignment',
            index: 13,
            displayName: 'Text Horizontal Align',
            type: {
                name: 'enum',
                enums: [
                    {label: 'left', value: 'left'},
                    {label: 'center', value: 'center'},
                    {label: 'right', value: 'right'}
                ],
                alignComp: 'justify'
            },
            default: 'left',
            set(value) {
                switch(value) {
                    case 'left': this.setStyle({textAlign: 'left', justifyContent: 'flex-start'}); break;
                    case 'center': this.setStyle({textAlign: 'center', justifyContent: 'center'}); break;
                    case 'right': this.setStyle({textAlign: 'right', justifyContent: 'flex-end'}); break;
                }
            }
        },
        textAlignY: {
            group: 'Text Alignment',
            index: 14,
            displayName: 'Text Vertical Align',
            type: {
                name: 'enum',
                enums: [
                    {label: 'Top', value: 'top'},
                    {label: 'Center', value: 'center'},
                    {label: 'Bottom', value: 'bottom'}
                ],
                alignComp: 'vertical'
            },
            default: 'top',
            set(value) {
                switch(value) {
                    case 'top': this.setStyle({alignItems: 'flex-start'}); break;
                    case 'center': this.setStyle({alignItems: 'center'}); break;
                    case 'bottom': this.setStyle({alignItems: 'flex-end'}); break;
                }
            }
        }*/
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
      type: 'color',
      default: '#FFFFFF'
    },
    backgroundColor: {
      index: 100,
      displayName: 'Background Color',
      group: 'Style',
      type: 'color',
      default: '#000000'
    },

    // Padding
    paddingLeft: {
      index: 64,
      group: 'Margin and padding',
      default: 20,
      applyDefault: false,
      displayName: 'Pad Left',
      type: { name: 'number', units: ['px'], defaultUnit: 'px', marginPaddingComp: 'padding-left' }
    },
    paddingRight: {
      index: 65,
      group: 'Margin and padding',
      default: 20,
      applyDefault: false,
      displayName: 'Pad Right',
      type: { name: 'number', units: ['px'], defaultUnit: 'px', marginPaddingComp: 'padding-right' }
    },
    paddingTop: {
      index: 66,
      group: 'Margin and padding',
      displayName: 'Pad Top',
      default: 5,
      applyDefault: false,
      type: { name: 'number', units: ['px'], defaultUnit: 'px', marginPaddingComp: 'padding-top' }
    },
    paddingBottom: {
      index: 67,
      group: 'Margin and padding',
      displayName: 'Pad Bottom',
      default: 5,
      applyDefault: false,
      type: { name: 'number', units: ['px'], defaultUnit: 'px', marginPaddingComp: 'padding-bottom' }
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
      default: 'none',
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
      default: 0,
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
    label: {
      type: 'string',
      displayName: 'Label',
      group: 'General',
      default: 'Label'
    },
    buttonType: {
      type: {
        name: 'enum',
        enums: [
          { label: 'Button', value: 'button' },
          { label: 'Submit', value: 'submit' }
        ]
      },
      displayName: 'Type',
      default: 'button',
      group: 'General'
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
  outputProps: {
    // Click
    onClick: {
      displayName: 'Click',
      group: 'Events',
      type: 'signal'
    }
  },
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

NodeSharedPortDefinitions.addDimensions(ButtonNode, {
  defaultSizeMode: 'contentSize',
  contentLabel: 'Content',
  useDimensionConstraints: false
});
NodeSharedPortDefinitions.addAlignInputs(ButtonNode);
NodeSharedPortDefinitions.addTransformInputs(ButtonNode);
//NodeSharedPortDefinitions.addPaddingInputs(ButtonNode);
NodeSharedPortDefinitions.addMarginInputs(ButtonNode);
NodeSharedPortDefinitions.addSharedVisualInputs(ButtonNode);
Utils.addControlEventsAndStates(ButtonNode);

ButtonNode = createNodeFromReactComponent(ButtonNode);
ButtonNode.setup = function (context, graphModel) {
  graphModel.on('nodeAdded.Button', function (node) {
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

export default ButtonNode;
