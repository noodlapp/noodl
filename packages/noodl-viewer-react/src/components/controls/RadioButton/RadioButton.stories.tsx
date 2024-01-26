import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { RadioButton } from './RadioButton';

export default {
  title: 'Controls/Radio Button',
  component: RadioButton,
  argTypes: {}
} as ComponentMeta<typeof RadioButton>;

const Template: ComponentStory<typeof RadioButton> = (args) => <RadioButton {...args} />;

export const Common = Template.bind({});
Common.args = {};
