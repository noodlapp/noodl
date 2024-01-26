import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { ActivityIndicator } from './ActivityIndicator';

export default {
  title: 'Common/Activity Indicator',
  component: ActivityIndicator,
  argTypes: {},
} as ComponentMeta<typeof ActivityIndicator>;

const Template: ComponentStory<typeof ActivityIndicator> = (args) => (
  <ActivityIndicator {...args} />
);

export const Common = Template.bind({});
Common.args = {};
