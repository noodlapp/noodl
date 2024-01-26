import React from 'react';

import FontLoader from '../../fontloader';
import guid from '../../guid';
import Layout from '../../layout';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import Utils from './utils';

//this stops a text field from being unfocused by the clickHandler in the viewer that handles focus globally.
//The specific case is when a mouseDown is registered in the input, but the mouseUp is outside.
//It'll trigger a focus change that'll blur the input field, which is annyoing when you're selecting text
function preventGlobalFocusChange(e) {
  e.stopPropagation();
  window.removeEventListener('click', preventGlobalFocusChange, true);
}

class TextFieldComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.startValue
    };
    this.ref = React.createRef();
  }

  setText(value) {
    this.setState({ value });
    this.props.onTextChanged && this.props.onTextChanged(value);
  }

  componentDidMount() {
    //plumbing for the focused signals
    this.ref.current.noodlNode = this.props.noodlNode;

    this.setText(this.props.startValue);
  }

  render() {
    const style = { ...this.props.textStyle, ...this.props.style };
    Layout.size(style, this.props);
    Layout.align(style, this.props);

    if (style.opacity === 0) {
      style.pointerEvents = 'none';
    }

    const props = this.props;

    const sharedProps = {
      id: props.id,
      value: this.state.value,
      ...Utils.controlEvents(props),
      disabled: !props.enabled,
      style,
      className: props.className,
      placeholder: props.placeholder,
      onChange: (e) => this.onChange(e)
    };

    if (this.props.type !== 'textArea') {
      return (
        <input
          ref={this.ref}
          type={this.props.type}
          {...sharedProps}
          onKeyDown={(e) => this.onKeyDown(e)}
          onMouseDown={() => window.addEventListener('click', preventGlobalFocusChange, true)}
        />
      );
    } else {
      sharedProps.style.resize = 'none'; //disable user resizing
      return <textarea ref={this.ref} {...sharedProps} onKeyDown={(e) => this.onKeyDown(e)} />;
    }
  }

  onKeyDown(e) {
    if (e.key === 'Enter' || e.which === 13) {
      this.props.onEnter && this.props.onEnter();
    }
  }

  onChange(event) {
    const value = event.target.value;
    this.setText(value);
  }

  focus() {
    this.ref.current && this.ref.current.focus();
  }

  blur() {
    this.ref.current && this.ref.current.blur();
  }
}

const TextInput = {
  name: 'Text Input',
  docs: 'https://docs.noodl.net/nodes/visual/text-input',
  allowChildren: false,
  noodlNodeAsProp: true,
  getReactComponent() {
    return TextFieldComponent;
  },
  defaultCss: {
    outline: 'none',
    borderStyle: 'solid',
    padding: 0
  },
  initialize() {
    this.props.startValue = '';

    this.props.id = this._internal.controlId = 'input-' + guid();
    this.props.enabled = this._internal.enabled = true;
    this.outputPropValues.hoverState = this.outputPropValues.focusState = this.outputPropValues.pressedState = false;
  },
  inputProps: {
    type: {
      displayName: 'Type',
      group: 'Text',
      index: 19,
      type: {
        name: 'enum',
        enums: [
          { label: 'Text', value: 'text' },
          { label: 'Text Area', value: 'textArea' },
          { label: 'Email', value: 'email' },
          { label: 'Number', value: 'number' },
          { label: 'Password', value: 'password' },
          { label: 'URL', value: 'url' }
        ]
      },
      default: 'text'
    },
    placeholder: {
      index: 22,
      group: 'Text',
      displayName: 'Placeholder',
      default: 'Type here...',
      type: {
        name: 'string'
      }
    },
    /* disabled: {
            group: 'Text',
            index: 23,
            displayName: 'Disabled',
            propPath: 'dom',
            default: false,
            type: 'boolean'
        }*/

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

    set: {
      group: 'Actions',
      displayName: 'Set',
      type: 'signal',
      valueChangedToTrue() {
        this.scheduleAfterInputsHaveUpdated(() => {
          this.setText(this._internal.text);
        });
      }
    },
    startValue: {
      index: 18,
      displayName: 'Text',
      type: 'string',
      group: 'Text',
      set(value) {
        if (this._internal.text === value) return;

        this._internal.text = value;
        if (this.isInputConnected('set') === false) {
          this.setText(value);
        }
      }
    },
    textStyle: {
      index: 19,
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
      index: 20,
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
    },
    clear: {
      type: 'signal',
      group: 'Actions',
      displayName: 'Clear',
      valueChangedToTrue() {
        this.setText('');
      }
    },
    focus: {
      type: 'signal',
      group: 'Actions',
      displayName: 'Focus',
      valueChangedToTrue() {
        this.context.setNodeFocused(this, true);
      }
    },
    blur: {
      type: 'signal',
      group: 'Actions',
      displayName: 'Blur',
      valueChangedToTrue() {
        this.context.setNodeFocused(this, false);
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
      index: 99,
      type: 'color',
      displayName: 'Font Color',
      group: 'Style'
    },
    backgroundColor: {
      index: 100,
      displayName: 'Background Color',
      group: 'Style',
      type: 'color',
      default: 'transparent'
    },
    borderColor: {
      index: 101,
      displayName: 'Border Color',
      group: 'Style',
      type: 'color',
      default: 'black'
    },
    borderWidth: {
      index: 102,
      displayName: 'Border Width',
      group: 'Style',
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      default: 0
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
    }
  },
  outputProps: {
    // Value
    onTextChanged: {
      group: 'Value',
      displayName: 'Text',
      type: 'string'
    },

    // Events
    onEnter: {
      group: 'Events',
      displayName: 'On Enter',
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
  methods: {
    _focus() {
      if (!this.innerReactComponentRef) return;
      this.innerReactComponentRef.focus();
    },
    _blur() {
      if (!this.innerReactComponentRef) return;
      this.innerReactComponentRef.blur();
    },
    setText(text) {
      this.props.startValue = text;
      if (this.innerReactComponentRef) {
        //the text component is mounted, and will signal the onTextChanged output
        this.innerReactComponentRef.setText(text);
      } else if (this.outputPropValues['onTextChanged'] !== text) {
        //text component isn't mounted, set the output manually
        this.outputPropValues['onTextChanged'] = text;
        this.flagOutputDirty('onTextChanged');
      }
    }
  }
};

NodeSharedPortDefinitions.addDimensions(TextInput, { defaultSizeMode: 'contentSize', contentLabel: 'Text' });
NodeSharedPortDefinitions.addAlignInputs(TextInput);
NodeSharedPortDefinitions.addTransformInputs(TextInput);
NodeSharedPortDefinitions.addPaddingInputs(TextInput);
NodeSharedPortDefinitions.addMarginInputs(TextInput);
NodeSharedPortDefinitions.addSharedVisualInputs(TextInput);
Utils.addControlEventsAndStates(TextInput);

const definition = createNodeFromReactComponent(TextInput);
definition.setup = function (context, graphModel) {
  graphModel.on('nodeAdded.Text Input', function (node) {
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

export default definition;
