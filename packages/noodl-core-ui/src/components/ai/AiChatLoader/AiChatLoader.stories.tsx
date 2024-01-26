import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { AiChatLoader } from './AiChatLoader';

export default {
  title: 'Ai/Ai Chat Loader',
  component: AiChatLoader,
  argTypes: {}
} as ComponentMeta<typeof AiChatLoader>;

const Template: ComponentStory<typeof AiChatLoader> = (args) => (
  <div style={{ width: '337px' }}>
    <AiChatLoader {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {};

export const LongText = Template.bind({});
LongText.args = {
  text: 'Making sense of the universe... one moment please!'
};
