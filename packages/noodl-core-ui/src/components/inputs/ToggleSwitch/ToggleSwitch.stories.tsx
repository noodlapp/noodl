import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { ToggleSwitch } from './ToggleSwitch';

export default {
  title: 'Inputs/Toggle Switch',
  component: ToggleSwitch,
  argTypes: {}
} as ComponentMeta<typeof ToggleSwitch>;

const Template: ComponentStory<typeof ToggleSwitch> = (args) => <ToggleSwitch {...args} />;

export const Common = Template.bind({});
Common.args = {};
