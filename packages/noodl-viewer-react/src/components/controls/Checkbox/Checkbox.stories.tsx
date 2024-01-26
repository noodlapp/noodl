import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Checkbox } from './Checkbox';

export default {
  title: 'CATEGORY_HERE/Checkbox',
  component: Checkbox,
  argTypes: {}
} as ComponentMeta<typeof Checkbox>;

const Template: ComponentStory<typeof Checkbox> = (args) => <Checkbox {...args} />;

export const Common = Template.bind({});
Common.args = {};
