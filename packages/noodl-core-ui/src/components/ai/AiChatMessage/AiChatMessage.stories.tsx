import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';

import { AiChatMessage } from './AiChatMessage';

export default {
  title: 'Ai/Ai Chat Message',
  component: AiChatMessage,
  argTypes: {}
} as ComponentMeta<typeof AiChatMessage>;

const Template: ComponentStory<typeof AiChatMessage> = (args) => (
  <div style={{ maxWidth: '280px' }}>
    <AiChatMessage {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  user: {
    role: 'user',
    name: 'Tore K'
  },
  content: 'Get the current weather at my location.'
};

export const User_BigContent = Template.bind({});
User_BigContent.args = {
  user: {
    role: 'user',
    name: 'Tore K'
  },
  content: `This Function node fetches a location's address using its latitude and longitude from Google's Geocoding API. It requires an API key, latitude, and longitude as inputs and outputs the formatted address and success or failure signals.`
};

export const Assistant_BigContent = Template.bind({});
Assistant_BigContent.args = {
  user: {
    role: 'assistant'
  },
  content: `This Function node fetches a location's address using its latitude and longitude from Google's Geocoding API. It requires an API key, latitude, and longitude as inputs and outputs the formatted address and success or failure signals.`
};

export const Assistant_BigContentAffix = Template.bind({});
Assistant_BigContentAffix.args = {
  user: {
    role: 'assistant'
  },
  content: `This Function node fetches a location's address using its latitude and longitude from Google's Geocoding API. It requires an API key, latitude, and longitude as inputs and outputs the formatted address and success or failure signals.`,
  affix: (
    <PrimaryButton
      size={PrimaryButtonSize.Small}
      variant={PrimaryButtonVariant.MutedOnLowBg}
      icon={IconName.ImportSlanted}
      label="Open code editor"
      isGrowing
    />
  )
};

export const None_BigContent = Template.bind({});
None_BigContent.args = {
  user: null,
  content: `This Function node fetches a location's address using its latitude and longitude from Google's Geocoding API. It requires an API key, latitude, and longitude as inputs and outputs the formatted address and success or failure signals.`
};
