import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Group } from './Group';

export default {
  title: 'Preview/Property Panel/[WIP] Group',
  component: Group,
  argTypes: {}
} as ComponentMeta<typeof Group>;

const Template: ComponentStory<typeof Group> = (args) => <Group></Group>;

export const Primary = Template.bind({});
Primary.args = {};
