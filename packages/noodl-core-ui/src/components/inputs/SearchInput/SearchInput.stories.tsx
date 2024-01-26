import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { SearchInput } from './SearchInput';

export default {
  title: 'Inputs/Search Input',
  component: SearchInput,
  argTypes: {},
} as ComponentMeta<typeof SearchInput>;

const Template: ComponentStory<typeof SearchInput> = (args) => <SearchInput {...args} />;

export const Common = Template.bind({});
Common.args = {};
