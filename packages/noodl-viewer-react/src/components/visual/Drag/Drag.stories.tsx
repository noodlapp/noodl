import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Drag } from './Drag';

export default {
  title: 'CATEGORY_HERE/Drag',
  component: Drag,
  argTypes: {},
} as ComponentMeta<typeof Drag>;

const Template: ComponentStory<typeof Drag> = (args) => <Drag {...args} />;

export const Common = Template.bind({});
Common.args = {};