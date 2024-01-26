import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { PrimaryButton, PrimaryButtonVariant } from './PrimaryButton';

export default {
  title: 'Inputs/Primary Button',
  component: PrimaryButton,
  argTypes: {}
} as ComponentMeta<typeof PrimaryButton>;

const Template: ComponentStory<typeof PrimaryButton> = (args) => <PrimaryButton {...args} />;

export const Common = Template.bind({});
Common.args = {};

export const Primary = Template.bind({});
Primary.args = {
  label: 'Click me'
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Click me',
  isDisabled: true
};

export const Muted = Template.bind({});
Muted.args = {
  label: 'Click me',
  variant: PrimaryButtonVariant.Muted
};

export const Ghost = Template.bind({});
Ghost.args = {
  label: 'Click me',
  variant: PrimaryButtonVariant.Ghost
};

export const Danger = Template.bind({});
Danger.args = {
  label: 'Click me',
  variant: PrimaryButtonVariant.Danger
};
