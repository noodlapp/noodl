import React from 'react';

import { flexDirectionValues } from '../../constants/flex';
import Layout from '../../layout';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';

function Form(props) {
  var style = { ...props.style };
  Layout.size(style, props);
  Layout.align(style, props);

  let className = 'ndl-controls-form';
  if (props.className) className = className + ' ' + props.className;

  return (
    <form
      className={className}
      style={style}
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit && props.onSubmit();
      }}
    >
      {props.children}
    </form>
  );
}

var FormNode = {
  name: 'Form',
  docs: 'https://docs.noodl.net/nodes/visual/form',
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
    return Form;
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
          { label: 'None', value: 'none' },
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
  outputProps: {
    onSubmit: { type: 'signal', displayName: 'Submit', group: 'Events' }
  }
};

NodeSharedPortDefinitions.addDimensions(FormNode, { defaultSizeMode: 'contentSize', contentLabel: 'Content' });
NodeSharedPortDefinitions.addAlignInputs(FormNode);
NodeSharedPortDefinitions.addTransformInputs(FormNode);
NodeSharedPortDefinitions.addMarginInputs(FormNode);
NodeSharedPortDefinitions.addPaddingInputs(FormNode);
NodeSharedPortDefinitions.addSharedVisualInputs(FormNode);

FormNode = createNodeFromReactComponent(FormNode);
export default FormNode;
