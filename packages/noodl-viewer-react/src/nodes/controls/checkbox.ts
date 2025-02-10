import { Checkbox } from '../../components/controls/Checkbox';
import guid from '../../guid';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import Utils from './utils';

const CheckBoxNode = {
  name: 'net.noodl.controls.checkbox',
  displayName: 'Checkbox',
  docs: 'https://docs.noodl.net/nodes/ui-controls/checkbox',
  allowChildren: false,
  noodlNodeAsProp: true,
  nodeDoubleClickAction: {
    focusPort: 'label'
  },
  usePortAsLabel: 'label',
  portLabelTruncationMode: 'length',
  connectionPanel: {
    groupPriority: [
      'General',
      'Style',
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
    this.props.checked = this._internal.checked = false;

    this.props.checkedChanged = (checked) => {
      const changed = this._internal.checked !== checked;
      this._internal.checked = checked;
      if (changed) {
        this.flagOutputDirty('checked');
        this.sendSignalOnOutput('onChange');
        this._updateVisualState();
      }
    };
  },
  getReactComponent() {
    return Checkbox;
  },
  inputs: {
    checked: {
      type: 'boolean',
      displayName: 'Checked',
      group: 'General',
      default: false,
      index: 100,
      set: function (value) {
        value = !!value;
        const changed = value !== this._internal.checked;
        this.props.checked = this._internal.checked = value;

        if (changed) {
          this.forceUpdate();
          this.flagOutputDirty('checked');
          this._updateVisualState();
        }
      }
    },
    check: {
      type: 'signal',
      displayName: 'Check',
      group: 'Actions',
      valueChangedToTrue() {
        if (this._internal.checked === true) return;

        this.props.checked = this._internal.checked = true;

        this.forceUpdate();
        this.flagOutputDirty('checked');
        this._updateVisualState();
      }
    },
    uncheck: {
      type: 'signal',
      displayName: 'Uncheck',
      group: 'Actions',
      valueChangedToTrue() {
        if (this._internal.checked === false) return;

        this.props.checked = this._internal.checked = false;

        this.forceUpdate();
        this.flagOutputDirty('checked');
        this._updateVisualState();
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
  inputCss: {
    backgroundColor: {
      index: 201,
      displayName: 'Background Color',
      group: 'Style',
      type: 'color',
      default: 'transparent',
      applyDefault: false,
      allowVisualStates: true,
      styleTag: 'checkbox'
    },
    width: {
      index: 11,
      group: 'Dimensions',
      displayName: 'Width',
      type: {
        name: 'number',
        units: ['px', 'vw', 'vh'],
        defaultUnit: 'px'
      },
      default: 32,
      allowVisualStates: true,
      styleTag: 'checkbox'
    },
    height: {
      index: 12,
      group: 'Dimensions',
      displayName: 'Height',
      type: {
        name: 'number',
        units: ['px', 'vw', 'vh'],
        defaultUnit: 'px'
      },
      default: 32,
      allowVisualStates: true,
      styleTag: 'checkbox'
    }
  },
  outputs: {
    checked: {
      type: 'boolean',
      displayName: 'Checked',
      group: 'States',
      getter: function () {
        return this._internal.checked;
      }
    },
    onChange: {
      displayName: 'Changed',
      group: 'Events',
      type: 'signal'
    }
  }
};

NodeSharedPortDefinitions.addAlignInputs(CheckBoxNode);
NodeSharedPortDefinitions.addTransformInputs(CheckBoxNode);
NodeSharedPortDefinitions.addMarginInputs(CheckBoxNode);
NodeSharedPortDefinitions.addPaddingInputs(CheckBoxNode);
NodeSharedPortDefinitions.addIconInputs(CheckBoxNode);
NodeSharedPortDefinitions.addLabelInputs(CheckBoxNode, {
  enableSpacing: true,
  styleTag: 'label'
});
NodeSharedPortDefinitions.addSharedVisualInputs(CheckBoxNode);
NodeSharedPortDefinitions.addBorderInputs(CheckBoxNode, {
  defaults: {
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 3
  },
  styleTag: 'checkbox'
});
NodeSharedPortDefinitions.addShadowInputs(CheckBoxNode, {
  styleTag: 'checkbox'
});
Utils.addControlEventsAndStates(CheckBoxNode, { checked: true });

export default createNodeFromReactComponent(CheckBoxNode);
