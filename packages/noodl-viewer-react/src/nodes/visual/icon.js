import { Icon } from '../../components/visual/Icon';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';

const IconNode = {
  name: 'net.noodl.visual.icon',
  displayName: 'Icon',
  docs: 'https://docs.noodl.net/nodes/basic-elements/icon',
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
  getReactComponent() {
    return Icon;
  }
};
NodeSharedPortDefinitions.addAlignInputs(IconNode);
NodeSharedPortDefinitions.addTransformInputs(IconNode);
NodeSharedPortDefinitions.addPaddingInputs(IconNode, {
  defaults: {
    paddingTop: 5,
    paddingRight: 5,
    paddingBottom: 5,
    paddingLeft: 5
  }
});
NodeSharedPortDefinitions.addMarginInputs(IconNode);
NodeSharedPortDefinitions.addIconInputs(IconNode, {
  hideEnableIconInput: true,
  defaults: { useIcon: true }
});
NodeSharedPortDefinitions.addSharedVisualInputs(IconNode);

export default createNodeFromReactComponent(IconNode);
