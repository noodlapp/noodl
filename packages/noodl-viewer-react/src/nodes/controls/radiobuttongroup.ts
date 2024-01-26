import { RadioButtonGroup } from '../../components/controls/RadioButtonGroup';
import { flexDirectionValues } from '../../constants/flex';
import guid from '../../guid';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';

let RadioButtonGroupNode = {
  name: 'Radio Button Group',
  displayName: 'Radio Button Group',
  docs: 'https://docs.noodl.net/nodes/ui-controls/radio-button-group',
  allowChildren: true,
  noodlNodeAsProp: true,
  useVariants: false,
  connectionPanel: {
    groupPriority: ['General', 'Style', 'Actions', 'Events', 'Mounted', 'States']
  },
  initialize() {
    this.props.name = 'radio-' + guid();

    this.props.valueChanged = (value) => {
      const changed = this._internal.value !== value;
      this._internal.value = value;
      this.props.value = value;
      if (changed) {
        this.forceUpdate();
        this.flagOutputDirty('value');
        this.sendSignalOnOutput('onChange');
      }
    };
  },
  getReactComponent() {
    return RadioButtonGroup;
  },
  defaultCss: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column'
  },
  inputs: {
    flexDirection: {
      //don't rename for backwards compat
      index: 11,
      displayName: 'Layout',
      group: 'Layout',
      type: {
        name: 'enum',
        enums: [
          { label: 'Vertical', value: 'column' },
          { label: 'Horizontal', value: 'row' }
        ]
      },
      default: 'column',
      set(value) {
        this.props.layout = value;

        if (value !== 'none') {
          this.setStyle({ flexDirection: value });
        } else {
          this.removeStyle(['flexDirection']);
        }

        if (this.context.editorConnection) {
          // Send warning if the value is wrong
          if (value !== 'none' && !flexDirectionValues.includes(value)) {
            this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'layout-warning', {
              message: 'Invalid Layout value has to be a valid flex-direction value.'
            });
          } else {
            this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'layout-warning');
          }
        }

        this.forceUpdate();
      }
    },
    value: {
      index: 20,
      type: 'string',
      displayName: 'Value',
      group: 'General',
      set: function (value) {
        if (typeof value !== 'string' && value.toString !== undefined) value = value.toString();
        if (typeof value !== 'string') return;

        const changed = value !== this._internal.value;
        this.props.value = this._internal.value = value;

        if (changed) {
          this.forceUpdate();
          this.flagOutputDirty('value');
        }
      }
    }
  },
  outputs: {
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
  inputProps: {},
  outputProps: {}
};

NodeSharedPortDefinitions.addDimensions(RadioButtonGroupNode, {
  defaultSizeMode: 'contentSize',
  contentLabel: 'Content'
});
NodeSharedPortDefinitions.addAlignInputs(RadioButtonGroupNode);
NodeSharedPortDefinitions.addTransformInputs(RadioButtonGroupNode);
NodeSharedPortDefinitions.addMarginInputs(RadioButtonGroupNode);
NodeSharedPortDefinitions.addPaddingInputs(RadioButtonGroupNode);
NodeSharedPortDefinitions.addSharedVisualInputs(RadioButtonGroupNode);

RadioButtonGroupNode = createNodeFromReactComponent(RadioButtonGroupNode);
export default RadioButtonGroupNode;
