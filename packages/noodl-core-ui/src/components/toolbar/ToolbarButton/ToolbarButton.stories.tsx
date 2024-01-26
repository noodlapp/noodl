import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { ToolbarButton } from './ToolbarButton';

export default {
  title: 'Toolbar/Toolbar Button',
  component: ToolbarButton,
  argTypes: {
    label: { control: 'text' },
    prefix: { control: 'slot' }
  }
} as ComponentMeta<typeof ToolbarButton>;

const Template: ComponentStory<typeof ToolbarButton> = (args) => <ToolbarButton {...args} />;

export const Common = Template.bind({});
Common.args = {
  label: 'PRESS ME',
};
