import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { AiChatboxError } from './AiChatboxError';

export default {
  title: 'Ai/Ai Chatbox Error',
  component: AiChatboxError,
  argTypes: {}
} as ComponentMeta<typeof AiChatboxError>;

const Template: ComponentStory<typeof AiChatboxError> = (args) => (
  <div style={{ maxWidth: '380px', height: '800px', border: '1px solid black' }}>
    <AiChatboxError {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {};

export const NotFound = Template.bind({});
NotFound.args = {
  content:
    'Cannot find the chat history for this node. Could it be that the chat history is missing in Version Control? :('
};
