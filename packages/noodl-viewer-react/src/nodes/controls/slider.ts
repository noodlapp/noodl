import { Slider } from '../../components/controls/Slider';
import guid from '../../guid';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import Utils from './utils';

const thumbPopout = { group: 'thumb-styles', label: 'Thumb Styles' };
const trackPopout = { group: 'track-styles', label: 'Track Styles' };

const RangeNode = {
  name: 'net.noodl.controls.range',
  displayNodeName: 'Slider',
  docs: 'https://docs.noodl.net/nodes/ui-controls/slider',
  allowChildren: false,
  noodlNodeAsProp: true,
  connectionPanel: {
    groupPriority: [
      'General',
      'Style',
      'Actions',
      'Events',
      'States',
      'Mounted',
      'Hover Events',
      'Pointer Events',
      'Focus Events'
    ]
  },
  initialize() {
    this.props.attrs = {};
    this.props.sizeMode = 'contentHeight';
    this.props.id = 'input-' + guid();

    this.props.value = this.props.min;
    this._internal.outputValue = 0;

    this.props._nodeId = this.id;

    //this is used by the range to communicate with the node whenever the range changes value
    this.props.updateOutputValue = (value: string | number) => {
      value = typeof value === 'string' ? parseFloat(value) : value;

      const valueChanged = this._internal.outputValue !== value;
      if (valueChanged) {
        this._internal.outputValue = value;
        this.flagOutputDirty('value');
        this._updateOutputValuePercent(value);
        this.sendSignalOnOutput('onChange');
      }

      // On first mount, output the initial percentage.
      if (!this._internal.valuePercent) {
        this._updateOutputValuePercent(value);
      }
    };

    this.props.updateOutputValue(this.props.value); // Set the value output to an initial value
  },
  getReactComponent() {
    return Slider;
  },
  inputs: {
    value: {
      type: 'string',
      displayName: 'Value',
      group: 'General',
      index: 100,
      set(value) {
        this._setInputValue(value);
      }
    },
    testId: {
      index: 100009,
      displayName: 'Test ID Attribute',
      group: 'Advanced HTML',
      type: 'string',
      set(value) {
        this.props.attrs["data-testid"] = value;
        this.forceUpdate();
      }
    }
  },
  outputs: {
    value: {
      type: 'number',
      displayName: 'Value',
      group: 'States',
      get() {
        return this._internal.outputValue;
      }
    },
    valuePercent: {
      type: 'number',
      displayName: 'Value Percent',
      group: 'States',
      get() {
        return this._internal.valuePercent;
      }
    },
    onChange: {
      type: 'signal',
      displayName: 'Changed',
      group: 'Events'
    }
  },
  inputProps: {
    min: {
      type: 'number',
      displayName: 'Min',
      group: 'General',
      default: 0,
      index: 100,
      onChange() {
        this._setInputValue(this.props.value);
      }
    },
    max: {
      type: 'number',
      displayName: 'Max',
      group: 'General',
      default: 100,
      index: 100,
      onChange() {
        this._setInputValue(this.props.value);
      }
    },
    step: {
      type: 'number',
      displayName: 'Step',
      group: 'General',
      default: 1,
      index: 100
    },
    width: {
      index: 11,
      group: 'Dimensions',
      displayName: 'Width',
      type: {
        name: 'number',
        units: ['%', 'px', 'vw'],
        defaultUnit: '%'
      },
      default: 100,
      allowVisualStates: true
    },
    // Styles
    thumbWidth: {
      group: 'Thumb Style',
      displayName: 'Width',
      type: {
        name: 'number',
        units: ['px', 'vw', '%'],
        defaultUnit: 'px',
        allowEditOnly: true
      },
      default: 16,
      popout: thumbPopout,
      allowVisualStates: true
    },
    thumbHeight: {
      group: 'Thumb Style',
      displayName: 'Height',
      type: {
        name: 'number',
        units: ['px', 'vh', '%'],
        defaultUnit: 'px',
        allowEditOnly: true
      },
      default: 16,
      popout: thumbPopout,
      allowVisualStates: true
    },
    thumbColor: {
      group: 'Thumb Style',
      displayName: 'Color',
      type: { name: 'color', allowEditOnly: true },
      default: '#000000',
      popout: thumbPopout,
      allowVisualStates: true
    },
    trackHeight: {
      group: 'Track Style',
      displayName: 'Height',
      type: {
        name: 'number',
        units: ['px', 'vh', '%'],
        defaultUnit: 'px',
        allowEditOnly: true
      },
      default: 6,
      popout: trackPopout,
      allowVisualStates: true
    },
    trackColor: {
      group: 'Track Style',
      displayName: 'Inactive Color',
      type: { name: 'color', allowEditOnly: true },
      default: '#f0f0f0',
      popout: trackPopout,
      allowVisualStates: true
    },
    trackActiveColor: {
      group: 'Track Style',
      displayName: 'Active Color',
      type: { name: 'color', allowEditOnly: true },
      default: '#f0f0f0',
      popout: trackPopout,
      allowVisualStates: true
    }
  },
  methods: {
    _updateOutputValuePercent(value: number) {
      const min = this.props.min;
      const max = this.props.max;
      const valuePercent = Math.floor(((value - min) / (max - min)) * 100);
      const valuePercentChanged = this._internal.valuePercentChanged !== valuePercent;

      this._internal.valuePercent = valuePercent;
      valuePercentChanged && this.flagOutputDirty('valuePercent');
    },
    _setInputValue(newValue) {
      //make sure value never goes out of range
      const value = Math.max(this.props.min, Math.min(this.props.max, newValue || 0));

      const changed = value !== this.props.value;

      if (changed) {
        this.props.value = value;
        this.forceUpdate();
      }
    }
  }
};

//Add borders
function addBorderInputs(definition, opts) {
  opts = opts || {};
  const defaults = opts.defaults || {};
  const popout = opts.popout;

  defaults.borderStyle = 'none';
  defaults.borderWidth = 0;
  defaults.borderColor = '#000000';

  const prefixLabel = opts.propPrefix[0].toUpperCase() + opts.propPrefix.slice(1);

  function defineBorderTab(definition, suffix, tabName, indexOffset) {
    const styleName = opts.propPrefix + `Border${suffix}Style`;
    const widthName = opts.propPrefix + `Border${suffix}Width`;
    const colorName = opts.propPrefix + `Border${suffix}Color`;

    let orNotSet = defaults.borderStyle !== 'none' ? 'OR borderStyle NOT SET' : '';

    if (suffix) {
      if (defaults[styleName] && defaults[styleName] !== 'none') orNotSet += `OR ${styleName} NOT SET`;
      NodeSharedPortDefinitions.addDynamicInputPorts(
        definition,
        `${styleName} = solid OR ${styleName} = dashed OR ${styleName} = dotted OR borderStyle = solid OR borderStyle = dashed OR borderStyle = dotted ${orNotSet}`,
        [`${widthName}`, `${colorName}`]
      );
    } else {
      NodeSharedPortDefinitions.addDynamicInputPorts(
        definition,
        `${styleName} = solid OR ${styleName} = dashed OR ${styleName} = dotted ${orNotSet}`,
        [`${widthName}`, `${colorName}`]
      );
    }

    const tab = {
      group: opts.propPrefix + '-border-styles',
      tab: tabName,
      label: suffix
    };

    const editorName = (name) => `${prefixLabel} ${name} ${suffix ? '(' + suffix + ')' : ''}`;
    const index = 202 + indexOffset * 4;

    const groupName = prefixLabel + ' Border Style';

    NodeSharedPortDefinitions.addInputProps(definition, {
      [styleName]: {
        index: index + 1,
        displayName: 'Border Style',
        editorName: editorName('Border Style'),
        group: groupName,
        type: {
          name: 'enum',
          enums: [
            { label: 'None', value: 'none' },
            { label: 'Solid', value: 'solid' },
            { label: 'Dotted', value: 'dotted' },
            { label: 'Dashed', value: 'dashed' }
          ]
        },
        default: defaults[`border${suffix}Style`],
        tab,
        popout,
        allowVisualStates: true
      },
      [widthName]: {
        index: index + 2,
        displayName: 'Border Width',
        editorName: editorName('Border Width'),
        group: groupName,
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px'
        },
        default: defaults[`border${suffix}Width`],
        tab,
        popout,
        allowVisualStates: true
      },
      [colorName]: {
        index: index + 3,
        displayName: 'Border Color',
        editorName: editorName('Border Color'),
        group: groupName,
        type: 'color',
        default: defaults[`border${suffix}Color`],
        tab,
        popout,
        allowVisualStates: true
      }
    });
  }

  defineBorderTab(definition, '', 'borders-all', 0);
  defineBorderTab(definition, 'Left', 'borders-left', 1);
  defineBorderTab(definition, 'Top', 'borders-top', 2);
  defineBorderTab(definition, 'Right', 'borders-right', 3);
  defineBorderTab(definition, 'Bottom', 'borders-bottom', 4);
}

function addBorderRadius(definition, opts) {
  opts = opts || {};
  const defaults = opts.defaults || {};
  const popout = opts.popout;

  if (!defaults.borderRadius) defaults.borderRadius = 0;

  const prefixLabel = opts.propPrefix[0].toUpperCase() + opts.propPrefix.slice(1);

  function defineCornerTab(definition, suffix, tabName, indexOffset) {
    const editorName = (name) => `${prefixLabel} ${name} ${suffix ? '(' + suffix + ')' : ''}`;

    const tab = {
      group: opts.propPrefix + '-corners',
      tab: tabName,
      label: suffix
    };
    const radiusName = `Border${suffix}Radius`;

    NodeSharedPortDefinitions.addInputProps(definition, {
      [opts.propPrefix + radiusName]: {
        index: 240 + indexOffset,
        displayName: 'Corner Radius',
        editorName: editorName('Corner Radius'),
        group: prefixLabel + ' Corner Radius',
        type: {
          name: 'number',
          units: ['px', '%'],
          defaultUnit: 'px'
        },
        default: defaults[`border${suffix}Radius`],
        tab,
        popout
      }
    });
  }

  defineCornerTab(definition, '', 'corners-all', 0);
  defineCornerTab(definition, 'TopLeft', 'corners-top-left', 1);
  defineCornerTab(definition, 'TopRight', 'corners-top-right', 2);
  defineCornerTab(definition, 'BottomRight', 'corners-bottom-right', 3);
  defineCornerTab(definition, 'BottomLeft', 'corners-bottom-left', 4);
}

function addShadowInputs(definition, opts) {
  opts = opts || {};
  const popout = opts.popout;
  const prefix = opts.propPrefix;

  NodeSharedPortDefinitions.addDynamicInputPorts(definition, `${prefix}BoxShadowEnabled = true`, [
    `${prefix}BoxShadowOffsetX`,
    `${prefix}BoxShadowOffsetY`,
    `${prefix}BoxShadowInset`,
    `${prefix}BoxShadowBlurRadius`,
    `${prefix}BoxShadowSpreadRadius`,
    `${prefix}BoxShadowColor`
  ]);

  const prefixLabel = opts.propPrefix[0].toUpperCase() + opts.propPrefix.slice(1);
  const editorName = (name) => `${prefixLabel} ${name}`;

  NodeSharedPortDefinitions.addInputProps(definition, {
    [`${prefix}BoxShadowEnabled`]: {
      index: 250,
      group: opts.group || 'Box Shadow',
      displayName: 'Shadow Enabled',
      editorName: editorName('Shadow Enabled'),
      type: 'boolean',
      allowVisualStates: true,
      popout
    },
    [`${prefix}BoxShadowOffsetX`]: {
      index: 251,
      group: opts.group || 'Box Shadow',
      displayName: 'Offset X',
      editorName: editorName('Offset X'),
      default: 0,
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      allowVisualStates: true,
      popout
    },
    [`${prefix}BoxShadowOffsetY`]: {
      index: 252,
      group: opts.group || 'Box Shadow',
      displayName: 'Offset Y',
      editorName: editorName('Offset Y'),
      default: 0,
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      allowVisualStates: true,
      popout
    },
    [`${prefix}BoxShadowBlurRadius`]: {
      index: 253,
      group: opts.group || 'Box Shadow',
      displayName: 'Blur Radius',
      editorName: editorName('Blur Radius'),
      default: 5,
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      allowVisualStates: true,
      popout
    },
    [`${prefix}BoxShadowSpreadRadius`]: {
      index: 254,
      group: opts.group || 'Box Shadow',
      displayName: 'Spread Radius',
      editorName: editorName('Spread Radius'),
      default: 2,
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      allowVisualStates: true,
      popout
    },
    [`${prefix}BoxShadowInset`]: {
      index: 255,
      group: opts.group || 'Box Shadow',
      displayName: 'Inset',
      editorName: editorName('Inset'),
      type: 'boolean',
      default: false,
      allowVisualStates: true,
      popout
    },
    [`${prefix}BoxShadowColor`]: {
      index: 256,
      group: opts.group || 'Box Shadow',
      displayName: 'Shadow Color',
      editorName: editorName('Shadow Color'),
      type: 'color',
      default: '#00000033',
      allowVisualStates: true,
      popout
    }
  });
}

NodeSharedPortDefinitions.addAlignInputs(RangeNode);
NodeSharedPortDefinitions.addTransformInputs(RangeNode);
NodeSharedPortDefinitions.addMarginInputs(RangeNode);
NodeSharedPortDefinitions.addPaddingInputs(RangeNode);
NodeSharedPortDefinitions.addSharedVisualInputs(RangeNode);
addBorderInputs(RangeNode, { propPrefix: 'track', popout: trackPopout });
addBorderRadius(RangeNode, { propPrefix: 'track', popout: trackPopout });
addShadowInputs(RangeNode, {
  propPrefix: 'track',
  popout: trackPopout,
  group: 'Track Box Shadow'
});

addBorderInputs(RangeNode, { propPrefix: 'thumb', popout: thumbPopout });
addBorderRadius(RangeNode, { propPrefix: 'thumb', popout: thumbPopout });
addShadowInputs(RangeNode, {
  propPrefix: 'thumb',
  popout: thumbPopout,
  group: 'Thumb Box Shadow'
});

Utils.addControlEventsAndStates(RangeNode);

export default createNodeFromReactComponent(RangeNode);
