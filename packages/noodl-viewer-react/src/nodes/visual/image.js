import { getAbsoluteUrl } from '@noodl/runtime/src/utils';

import { Image } from '../../components/visual/Image';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';

const ImageNode = {
  name: 'Image',
  docs: 'https://docs.noodl.net/nodes/basic-elements/image',
  noodlNodeAsProp: true,
  visualStates: [
    { name: 'neutral', label: 'Neutral' },
    { name: 'hover', label: 'Hover' }
  ],
  connectionPanel: {
    groupPriority: [
      'General',
      'Image',
      'Style',
      'Actions',
      'Events',
      'Mounted',
      'Pointer Events',
      'Hover Events',
      'Dimensions',
      'Margin and padding'
    ]
  },
  initialize() {
    this.props.attrs = {};
    this.props.default = '';
  },
  getReactComponent() {
    return Image;
  },
  getInspectInfo() {
    if (this.props.dom.srcSet) {
      return this.props.dom.srcSet;
    } else if (this.props.dom.src) {
      const src = this.props.dom.src.toString();
      return [
        { type: 'text', value: src },
        { type: 'image', value: src }
      ];
    }
  },
  allowChildren: false,
  defaultCss: {
    display: 'block',
    flexShrink: 0
  },
  inputCss: {
    objectFit: {
      displayName: 'Image Fit',
      group: 'Dimensions',
      type: {
        name: 'enum',
        enums: [
          { label: 'Fill', value: 'fill' },
          { label: 'Contain', value: 'contain' },
          { label: 'Cover', value: 'cover' },
          { label: 'None', value: 'none' },
          { label: 'Scale Down', value: 'scale-down' }
        ]
      },
      default: 'contain',
      allowVisualStates: true
    }
  },
  dynamicports: [
    {
      condition: 'sizeMode = explicit',
      inputs: ['objectFit']
    }
  ],
  inputs: {
    src: {
      displayName: 'Source',
      group: 'Image',
      propPath: 'dom',
      type: {
        name: 'image'
      },
      index: 30,
      allowVisualStates: true,
      set(url) {
        this.props.dom.src = getAbsoluteUrl(url);
        this.forceUpdate();
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
    srcSet: {
      displayName: 'Source Set',
      group: 'Image',
      propPath: 'dom',
      type: {
        name: 'string'
      },
      index: 31,
      allowVisualStates: true
    },
    alt: {
      displayName: 'Alternate text',
      tooltip: "The alt text is used by screen readers, or if the image can't be downloaded or displayed",
      type: 'string',
      propPath: 'dom',
      index: 1000,
      default: ''
    }
  },
  outputProps: {
    onLoad: {
      displayName: 'On Load',
      propPath: 'dom',
      type: 'signal',
      group: 'Events'
    },
    onError: {
      displayName: 'On Error',
      propPath: 'dom',
      type: 'signal',
      group: 'Events'
    }
  }
};

NodeSharedPortDefinitions.addDimensions(ImageNode, {
  defaultSizeMode: 'contentSize',
  contentLabel: 'Image'
});
NodeSharedPortDefinitions.addTransformInputs(ImageNode);
NodeSharedPortDefinitions.addMarginInputs(ImageNode);
NodeSharedPortDefinitions.addSharedVisualInputs(ImageNode);
NodeSharedPortDefinitions.addAlignInputs(ImageNode);
NodeSharedPortDefinitions.addPointerEventOutputs(ImageNode);
NodeSharedPortDefinitions.addBorderInputs(ImageNode);
NodeSharedPortDefinitions.addShadowInputs(ImageNode);

export default createNodeFromReactComponent(ImageNode);
