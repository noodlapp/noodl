import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Checkbox, CheckboxSize } from './Checkbox';

export default {
  title: 'Inputs/Checkbox',
  component: Checkbox,
  argTypes: {},
} as ComponentMeta<typeof Checkbox>;

const Template: ComponentStory<typeof Checkbox> = (args) => <Checkbox {...args} />;

export const Common = Template.bind({});
Common.args = {};

export const Selected = Template.bind({});
Selected.args = {
  label: "I want cookies",
  isChecked: true
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: "I want cookies",
  isDisabled: true,
};

export const HiddenCheckbox = Template.bind({});
HiddenCheckbox.args = {
  label: "I want cookies",
  hasHiddenCheckbox: true,
};

export const SizeSmall = Template.bind({});
SizeSmall.args = {
  label: "I want cookies",
  isChecked: true,
  checkboxSize: CheckboxSize.Small,
};

export const SizeLarge = Template.bind({});
SizeLarge.args = {
  label: "I want cookies",
  isChecked: true,
  checkboxSize: CheckboxSize.Large,
};
