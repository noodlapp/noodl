import { Circle } from '../../components/visual/Circle';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';

const CircleNode = {
  name: 'Circle',
  docs: 'https://docs.noodl.net/nodes/basic-elements/circle',
  connectionPanel: {
    groupPriority: [
      'General',
      'Fill',
      'Stroke',
      'Dimensions',
      'Style',
      'Actions',
      'Events',
      'Mounted',
      'Margin and padding',
      'Pointer Events',
      'Hover Events'
    ]
  },
  getReactComponent() {
    return Circle;
  },
  noodlNodeAsProp: true,
  allowChildren: false,
  defaultCss: {
    flexShrink: 0,
    position: 'relative',
    display: 'flex'
  },
  inputProps: {
    size: {
      displayName: 'Size',
      default: '100',
      group: 'Dimension',
      type: {
        name: 'number'
      },
      index: 10,
      allowVisualStates: true
    },
    fillEnabled: {
      group: 'Fill',
      displayName: 'Fill',
      default: true,
      type: 'boolean',
      index: 20,
      allowVisualStates: true
    },
    fillColor: {
      group: 'Fill',
      displayName: 'Fill Color',
      default: 'red',
      type: 'color',
      index: 21,
      allowVisualStates: true
    },
    strokeEnabled: {
      index: 23,
      group: 'Stroke',
      default: false,
      displayName: 'Stroke',
      type: 'boolean',
      allowVisualStates: true
    },
    strokeWidth: {
      index: 24,
      group: 'Stroke',
      displayName: 'Stroke Width',
      default: 10,
      type: {
        name: 'number'
      },
      allowVisualStates: true
    },
    strokeColor: {
      index: 25,
      group: 'Stroke',
      displayName: 'Stroke Color',
      type: 'color',
      default: 'black',
      allowVisualStates: true
    },
    strokeLineCap: {
      index: 26,
      group: 'Stroke',
      displayName: 'Line Cap',
      type: {
        name: 'enum',
        enums: [
          { label: 'Butt', value: 'butt' },
          { label: 'Round', value: 'round' }
        ]
      },
      default: 'butt',
      allowVisualStates: true
    },
    startAngle: {
      displayName: 'Start Angle',
      type: 'number',
      default: 0,
      group: 'Style',
      index: 198,
      allowVisualStates: true
    },
    endAngle: {
      displayName: 'End Angle',
      type: 'number',
      default: 360,
      group: 'Style',
      index: 199,
      allowVisualStates: true
    }
  }
};

NodeSharedPortDefinitions.addTransformInputs(CircleNode);
NodeSharedPortDefinitions.addMarginInputs(CircleNode);
NodeSharedPortDefinitions.addSharedVisualInputs(CircleNode);
NodeSharedPortDefinitions.addAlignInputs(CircleNode);
NodeSharedPortDefinitions.addPointerEventOutputs(CircleNode);

export default createNodeFromReactComponent(CircleNode);
