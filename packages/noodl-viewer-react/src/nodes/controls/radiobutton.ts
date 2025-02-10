import { RadioButton } from '../../components/controls/RadioButton';
import guid from '../../guid';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import Utils from './utils';

const RadioButtonNode = {
  name: 'net.noodl.controls.radiobutton',
  displayName: 'Radio Button',
  docs: 'https://docs.noodl.net/nodes/ui-controls/radio-button',
  allowChildren: false,
  noodlNodeAsProp: true,
  usePortAsLabel: 'label',
  nodeDoubleClickAction: {
    focusPort: 'label'
  },
  connectionPanel: {
    groupPriority: [
      'General',
      'Style',
      'Fill Style',
      'Actions',
      'Events',
      'States',
      'Mounted',
      'Label',
      'Label Text Style',
      'Hover Events',
      'Pointer Events',
      'Focus Events'
    ]
  },
  initialize() {
    this.props.attrs = {};
    this.props.sizeMode = 'explicit';
    this.props.id = 'input-' + guid();

    this._internal.checked = false;

    this.props.checkedChanged = (checked) => {
      const changed = this._internal.checked !== checked;
      this._internal.checked = checked;
      if (changed) {
        this.flagOutputDirty('checked');
        this._updateVisualState();
      }
    };

    this.props.styles.fill = {};
  },
  getReactComponent() {
    return RadioButton;
  },
  inputs: {
    fillColor: {
      index: 19,
      displayName: 'Fill Color',
      group: 'Fill Style',
      type: 'color',
      allowVisualStates: true,
      styleTag: 'fill',
      set(value) {
        this.setStyle({ backgroundColor: value }, 'fill');
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
  inputProps: {
    value: {
      type: 'string',
      displayName: 'Value',
      group: 'General',
      index: 100
    },
    fillSpacing: {
      displayName: 'Fill Spacing',
      group: 'Fill Style',
      type: {
        name: 'number',
        units: ['px', 'vw', 'vh'],
        defaultUnit: 'px'
      },
      allowVisualStates: true,
      default: 2
    }
  },
  inputCss: {
    width: {
      index: 11,
      group: 'Dimensions',
      displayName: 'Width',
      type: {
        name: 'number',
        units: ['px', '%', 'vw', 'vh'],
        defaultUnit: 'px'
      },
      default: 32,
      allowVisualStates: true,
      styleTag: 'radio',
      onChange() {
        this.forceUpdate();
      }
    },
    height: {
      index: 12,
      group: 'Dimensions',
      displayName: 'Height',
      type: {
        name: 'number',
        units: ['px', '%'],
        defaultUnit: 'px'
      },
      default: 32,
      allowVisualStates: true,
      styleTag: 'radio',
      onChange() {
        this.forceUpdate();
      }
    },
    backgroundColor: {
      index: 201,
      displayName: 'Background Color',
      group: 'Style',
      type: 'color',
      allowVisualStates: true,
      styleTag: 'radio',
      default: 'transparent',
      applyDefault: false
    }
  },
  outputs: {
    checked: {
      type: 'boolean',
      displayName: 'Checked',
      group: 'States',
      get() {
        return this._internal.checked;
      }
    }
  }
};

NodeSharedPortDefinitions.addAlignInputs(RadioButtonNode);
NodeSharedPortDefinitions.addTransformInputs(RadioButtonNode);
NodeSharedPortDefinitions.addMarginInputs(RadioButtonNode);
NodeSharedPortDefinitions.addPaddingInputs(RadioButtonNode);
NodeSharedPortDefinitions.addIconInputs(RadioButtonNode);
NodeSharedPortDefinitions.addLabelInputs(RadioButtonNode, {
  enableSpacing: true,
  styleTag: 'label'
});
NodeSharedPortDefinitions.addSharedVisualInputs(RadioButtonNode);
NodeSharedPortDefinitions.addBorderInputs(RadioButtonNode, {
  defaults: {
    borderStyle: 'solid',
    borderWidth: 2,
    borderRadius: 16
  },
  styleTag: 'radio'
});
NodeSharedPortDefinitions.addShadowInputs(RadioButtonNode, {
  styleTag: 'radio'
});
Utils.addControlEventsAndStates(RadioButtonNode, { checked: true });

export default createNodeFromReactComponent(RadioButtonNode);
