import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { InputLabelSection } from './InputLabelSection';

export default {
  title: 'Inputs/Input Label Section',
  component: InputLabelSection,
  argTypes: {},
} as ComponentMeta<typeof InputLabelSection>;

const Template: ComponentStory<typeof InputLabelSection> = (args) => <InputLabelSection {...args} />;

export const Common = Template.bind({});
Common.args = {
  label: 'Hello World',
};
