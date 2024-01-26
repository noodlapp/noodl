import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { AiIconAnimated } from './AiIconAnimated';

export default {
  title: 'Ai/Ai Icon Animated',
  component: AiIconAnimated,
  argTypes: {}
} as ComponentMeta<typeof AiIconAnimated>;

const Template: ComponentStory<typeof AiIconAnimated> = (args) => (
  <div
    style={{
      // A background is required for the mask to work
      backgroundColor: 'var(--theme-color-bg-3)'
    }}
  >
    <AiIconAnimated {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {};

export const Listening = Template.bind({});
Listening.args = {
  isListening: true
};
