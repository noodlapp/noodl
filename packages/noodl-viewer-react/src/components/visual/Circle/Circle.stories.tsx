import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Circle } from './Circle';

export default {
  title: 'CATEGORY_HERE/Circle',
  component: Circle,
  argTypes: {}
} as ComponentMeta<typeof Circle>;

const Template: ComponentStory<typeof Circle> = (args) => <Circle {...args} />;

export const Common = Template.bind({});
Common.args = {};
