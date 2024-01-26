import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Select } from './Select';

export default {
  title: 'Controls/Select',
  component: Select,
  argTypes: {}
} as ComponentMeta<typeof Select>;

const Template: ComponentStory<typeof Select> = (args) => <Select {...args} />;

export const Common = Template.bind({});
Common.args = {};
