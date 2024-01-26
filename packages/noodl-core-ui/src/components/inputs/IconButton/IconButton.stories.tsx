import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { IconButton } from './IconButton';

export default {
  title: 'Inputs/Icon Button',
  component: IconButton,
  argTypes: {}
} as ComponentMeta<typeof IconButton>;

const Template: ComponentStory<typeof IconButton> = (args) => (
  <>
    <IconButton {...args} />
  </>
);

export const Common = Template.bind({});
Common.args = {};
