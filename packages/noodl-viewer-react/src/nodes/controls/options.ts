import { Select } from '../../components/controls/Select';
import guid from '../../guid';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import Utils from './utils';

const OptionsNode = {
  name: 'net.noodl.controls.options',
  displayName: 'Dropdown',
  docs: 'https://docs.noodl.net/nodes/ui-controls/dropdown',
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
      'Actions',
      'Events',
      'States',
      'Mounted',
      'Text Style',
      'Label',
      'Label Text Style',
      'Hover Events',
      'Pointer Events',
      'Focus Events'
    ]
  },
  initialize: function () {
    this.props.attrs = {};
    this._itemsChanged = () => {
      this.forceUpdate();
    };

    this.props.id = 'input-' + guid();

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
    return Select;
  },
  inputs: {
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

        this.forceUpdate();
      }
    },
    value: {
      type: 'string',
      displayName: 'Value',
      group: 'General',
      set: function (value) {
        if (value !== undefined && typeof value !== 'string') {
          if (value?.toString !== undefined) value = value.toString();
          else return;
        }

        // // if value is passed in before the items, then items is undefined
        // if (this._internal.items) {
        //   //make sure this is a valid value that exists in the dropdown. If it doesn't, deselect all options
        //   value = this._internal.items.find((i) => i.Value === value) ? value : undefined;
        // }

        const changed = value !== this._internal.value;
        this.props.value = this._internal.value = value;

        if (changed) {
          this.forceUpdate();
          this.flagOutputDirty('value');
        }
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
    placeholder: {
      displayName: 'Placeholder',
      type: 'string',
      group: 'Placeholder'
    },
    placeholderOpacity: {
      group: 'Placeholder',
      displayName: 'Placeholder opacity',
      type: 'number',
      default: 0.5
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
  inputCss: {
    backgroundColor: {
      index: 100,
      displayName: 'Background Color',
      group: 'Style',
      type: 'color',
      default: 'transparent',
      styleTag: 'inputWrapper',
      allowVisualStates: true
    }
  }
};

NodeSharedPortDefinitions.addDimensions(OptionsNode, {
  defaultSizeMode: 'contentSize',
  contentLabel: 'Content'
});
NodeSharedPortDefinitions.addAlignInputs(OptionsNode);
NodeSharedPortDefinitions.addTextStyleInputs(OptionsNode);
NodeSharedPortDefinitions.addTransformInputs(OptionsNode);
NodeSharedPortDefinitions.addPaddingInputs(OptionsNode, {
  styleTag: 'inputWrapper'
});
NodeSharedPortDefinitions.addMarginInputs(OptionsNode);
NodeSharedPortDefinitions.addIconInputs(OptionsNode, {
  enableIconPlacement: true,
  defaults: { useIcon: false, iconColor: '#000000' }
});
NodeSharedPortDefinitions.addLabelInputs(OptionsNode, {
  enableSpacing: true,
  styleTag: 'label'
});
NodeSharedPortDefinitions.addSharedVisualInputs(OptionsNode);
NodeSharedPortDefinitions.addBorderInputs(OptionsNode, {
  defaults: {
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 5
  },
  styleTag: 'inputWrapper'
});

NodeSharedPortDefinitions.addShadowInputs(OptionsNode, {
  styleTag: 'inputWrapper'
});
Utils.addControlEventsAndStates(OptionsNode);

export default createNodeFromReactComponent(OptionsNode);
