import { Button } from '../../components/controls/Button';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import Utils from './utils';

const ButtonNode = {
  name: 'net.noodl.controls.button',
  displayName: 'Button',
  docs: 'https://docs.noodl.net/nodes/ui-controls/button',
  allowChildren: true,
  noodlNodeAsProp: true,
  usePortAsLabel: 'label',
  portLabelTruncationMode: 'length',
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
      'Label',
      'Label Text Style',
      'Hover Events',
      'Pointer Events',
      'Focus Events'
    ]
  },
  initialize() {
    this.props.attrs = {};
    this.props.layout = 'row'; //Used to tell child nodes what layout to expect
  },
  getReactComponent() {
    return Button;
  },
  inputs: {
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
      index: 100,
      displayName: 'Background Color',
      group: 'Style',
      type: 'color',
      default: '#000000',
      allowVisualStates: true
    }
  },
  outputProps: {
    onClick: {
      displayName: 'Click',
      group: 'Events',
      type: 'signal'
    }
  }
};

NodeSharedPortDefinitions.addDimensions(ButtonNode, {
  defaultSizeMode: 'contentSize',
  contentLabel: 'Content'
});
NodeSharedPortDefinitions.addTextStyleInputs(ButtonNode);
NodeSharedPortDefinitions.addAlignInputs(ButtonNode);
NodeSharedPortDefinitions.addTransformInputs(ButtonNode);
NodeSharedPortDefinitions.addPaddingInputs(ButtonNode, {
  defaults: {
    paddingTop: 5,
    paddingRight: 20,
    paddingBottom: 5,
    paddingLeft: 20
  }
});
NodeSharedPortDefinitions.addMarginInputs(ButtonNode);
NodeSharedPortDefinitions.addLabelInputs(ButtonNode, {
  defaults: { useLabel: true }
});
NodeSharedPortDefinitions.addIconInputs(ButtonNode, {
  enableIconPlacement: true,
  defaults: { useIcon: false }
});
NodeSharedPortDefinitions.addSharedVisualInputs(ButtonNode);
NodeSharedPortDefinitions.addBorderInputs(ButtonNode);
NodeSharedPortDefinitions.addShadowInputs(ButtonNode);

Utils.addControlEventsAndStates(ButtonNode);

export default createNodeFromReactComponent(ButtonNode);
