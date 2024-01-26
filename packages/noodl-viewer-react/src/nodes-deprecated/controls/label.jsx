import React from 'react';

import Layout from '../../layout';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';

function Label(props) {
  var style = { ...props.style };
  Layout.size(style, props);
  Layout.align(style, props);

  if (props.textStyle !== undefined) {
    // Apply text style
    style = Object.assign({}, props.textStyle, style);
  }

  const tagProps = {
    for: props.for,
    onClick: props.onClick
  };

  let className = 'ndl-controls-label';
  if (props.className) className = className + ' ' + props.className;

  return (
    <label className={className} style={style} {...tagProps}>
      {props.text}
    </label>
  );
}

const LabelNode = {
  name: 'Label',
  displayName: 'Label',
  docs: 'https://docs.noodl.net/nodes/visual/label',
  allowChildren: true,
  noodlNodeAsProp: true,
  deprecated: true,
  getReactComponent() {
    return Label;
  },
  defaultCss: {
    position: 'relative',
    display: 'flex'
  },
  inputProps: {
    for: { type: 'string', displayName: 'For', group: 'General' },
    text: { type: 'string', displayName: 'Text', group: 'General' }
  }
};
NodeSharedPortDefinitions.addDimensions(LabelNode, { defaultSizeMode: 'contentSize', contentLabel: 'Content' });
NodeSharedPortDefinitions.addAlignInputs(LabelNode);
NodeSharedPortDefinitions.addTextStyleInputs(LabelNode);
NodeSharedPortDefinitions.addTransformInputs(LabelNode);
//NodeSharedPortDefinitions.addPaddingInputs(LabelNode);
NodeSharedPortDefinitions.addMarginInputs(LabelNode);
NodeSharedPortDefinitions.addSharedVisualInputs(LabelNode);
NodeSharedPortDefinitions.addBorderInputs(LabelNode);

export default createNodeFromReactComponent(LabelNode);
