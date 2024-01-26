import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { ToolbarGrip } from './ToolbarGrip';

export default {
  title: 'Toolbar/Toolbar Grip',
  component: ToolbarGrip,
  argTypes: {}
} as ComponentMeta<typeof ToolbarGrip>;

const Template: ComponentStory<typeof ToolbarGrip> = (args) => <ToolbarGrip {...args} />;

export const Common = Template.bind({});
Common.args = {};
