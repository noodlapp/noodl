import { Text } from '../../components/visual/Text';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import { createTooltip } from '../../tooltips';

const TextNode = {
  name: 'Text',
  docs: 'https://docs.noodl.net/nodes/basic-elements/text',
  visualStates: [
    { name: 'neutral', label: 'Neutral' },
    { name: 'hover', label: 'Hover' }
  ],
  allowChildren: false,
  noodlNodeAsProp: true,
  usePortAsLabel: 'text',
  portLabelTruncationMode: 'length',
  connectionPanel: {
    groupPriority: ['General', 'Text', 'Text Style', 'Style', 'Events', 'Mounted', 'Hover Events', 'Pointer Events']
  },
  nodeDoubleClickAction: {
    focusPort: 'text'
  },
  initialize() {
    this.props.attrs = {};
  },
  getReactComponent() {
    return Text;
  },
  getInspectInfo() {
    return this.props.text;
  },
  defaultCss: {
    position: 'relative',
    display: 'flex'
  },
  inputProps: {
    text: {
      index: 19,
      group: 'Text',
      displayName: 'Text',
      default: 'Text',
      type: {
        name: 'string',
        multiline: true
      }
    },
    as: {
      index: 100000,
      group: 'Advanced HTML',
      displayName: 'Tag',
      type: {
        name: 'enum',
        enums: [
          { label: '<div>', value: 'div' },
          { label: '<h1>', value: 'h1' },
          { label: '<h2>', value: 'h2' },
          { label: '<h3>', value: 'h3' },
          { label: '<h4>', value: 'h4' },
          { label: '<h5>', value: 'h5' },
          { label: '<h6>', value: 'h6' },
          { label: '<p>', value: 'p' },
          { label: '<span>', value: 'span' }
          // { label: '<a>', value: 'a' },
        ]
      },
      default: 'div'
    }
  },
  inputCss: {
    wordBreak: {
      index: 27,
      group: 'Text',
      displayName: 'Word Break',
      applyDefault: false,
      type: {
        name: 'enum',
        enums: [
          { label: 'Normal', value: 'normal' },
          { label: 'Break All', value: 'break-all' }
        ]
      },
      default: 'normal'
    }
  },
  inputs: {
    textAlignX: {
      group: 'Text Alignment',
      index: 13,
      displayName: 'Text Horizontal Align',
      type: {
        name: 'enum',
        enums: [
          { label: 'left', value: 'left' },
          { label: 'center', value: 'center' },
          { label: 'right', value: 'right' }
        ],
        alignComp: 'justify'
      },
      default: 'left',
      set(value) {
        switch (value) {
          case 'left':
            this.setStyle({ textAlign: 'left', justifyContent: 'flex-start' });
            break;
          case 'center':
            this.setStyle({ textAlign: 'center', justifyContent: 'center' });
            break;
          case 'right':
            this.setStyle({ textAlign: 'right', justifyContent: 'flex-end' });
            break;
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
          { label: 'Top', value: 'top' },
          { label: 'Center', value: 'center' },
          { label: 'Bottom', value: 'bottom' }
        ],
        alignComp: 'vertical'
      },
      default: 'top',
      set(value) {
        switch (value) {
          case 'top':
            this.setStyle({ alignItems: 'flex-start' });
            break;
          case 'center':
            this.setStyle({ alignItems: 'center' });
            break;
          case 'bottom':
            this.setStyle({ alignItems: 'flex-end' });
            break;
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
  }
};

NodeSharedPortDefinitions.addDimensions(TextNode, {
  defaultSizeMode: 'contentHeight',
  contentLabel: 'Text'
});
NodeSharedPortDefinitions.addTextStyleInputs(TextNode);
NodeSharedPortDefinitions.addAlignInputs(TextNode);
NodeSharedPortDefinitions.addTransformInputs(TextNode);
NodeSharedPortDefinitions.addMarginInputs(TextNode);
NodeSharedPortDefinitions.addSharedVisualInputs(TextNode);
NodeSharedPortDefinitions.addPointerEventOutputs(TextNode);

function defineTooltips(node) {
  node.inputCss.wordBreak.tooltip = createTooltip({
    title: 'Word break',
    body: [
      'Control where line breaks are allowed',
      '- Normal: Break on spaces and other whitespace characters',
      '- Break All: Allow line breaks between any two characters, including inside words'
    ]
  });
}

// eslint-disable-next-line no-undef
if (!Noodl.runDeployed) {
  defineTooltips(TextNode);
}

export default createNodeFromReactComponent(TextNode);
