import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { EditorNode } from './EditorNode';

export default {
  title: 'Common/EditorNode',
  component: EditorNode,
  argTypes: {
    item: {
      defaultValue: {
        name: 'Group',
        displayName: 'Group'
      }
    },
    colors: {
      defaultValue: {
        base: '#315272',
        baseHighlighted: '#4d6784',
        header: '#173E5D',
        headerHighlighted: '#315272',
        outline: '#173E5D',
        outlineHighlighted: '#b58900',
        text: '#cfd5de'
      }
    }
  }
} as ComponentMeta<typeof EditorNode>;

const Template: ComponentStory<typeof EditorNode> = (args) => <EditorNode {...args} />;

export const Common = Template.bind({});
Common.args = {};
