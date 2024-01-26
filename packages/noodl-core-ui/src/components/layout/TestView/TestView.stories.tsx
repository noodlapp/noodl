import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { TestView } from './TestView';

export default {
  title: 'Layout/TestView',
  component: TestView,
  argTypes: {}
} as ComponentMeta<typeof TestView>;

const Template: ComponentStory<typeof TestView> = (args) => <TestView {...args} />

export const Common = Template.bind({});
Common.args = {};
