import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { TagButton } from './TagButton';

export default {
  title: 'Inputs/Tag Button',
  component: TagButton,
  argTypes: {},
} as ComponentMeta<typeof TagButton>;

const Template: ComponentStory<typeof TagButton> = (args) => <TagButton {...args} />;

export const Common = Template.bind({});
Common.args = {
  label: 'Hello World',
};
