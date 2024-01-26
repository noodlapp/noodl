import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Center } from './Center';

export default {
  title: 'Layout/Center',
  component: Center,
  argTypes: {}
} as ComponentMeta<typeof Center>;

const Template: ComponentStory<typeof Center> = (args) => <Center {...args} />;

export const Common = Template.bind({});
Common.args = {};
