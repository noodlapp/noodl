import React from 'react';

import { flexDirectionValues } from '../../constants/flex';
import Layout from '../../layout';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';

function FieldSet(props) {
  var style = { ...props.style };
  Layout.size(style, props);
  Layout.align(style, props);

  let className = 'ndl-controls-fieldset';
  if (props.className) className = className + ' ' + props.className;

  return (
    <fieldset className={className} style={style}>
      {props.children}
    </fieldset>
  );
}

var FieldSetNode = {
  name: 'Field Set',
  docs: 'https://docs.noodl.net/nodes/visual/fieldset',
  allowChildren: true,
  noodlNodeAsProp: true,
  deprecated: true,
  initialize() {},
  defaultCss: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column'
  },
  getReactComponent() {
    return FieldSet;
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
    }
  },
  inputProps: {},
  outputProps: {}
};

NodeSharedPortDefinitions.addDimensions(FieldSetNode, { defaultSizeMode: 'contentSize', contentLabel: 'Content' });
NodeSharedPortDefinitions.addAlignInputs(FieldSetNode);
NodeSharedPortDefinitions.addTransformInputs(FieldSetNode);
NodeSharedPortDefinitions.addMarginInputs(FieldSetNode);
NodeSharedPortDefinitions.addPaddingInputs(FieldSetNode);
NodeSharedPortDefinitions.addSharedVisualInputs(FieldSetNode);

FieldSetNode = createNodeFromReactComponent(FieldSetNode);
export default FieldSetNode;
