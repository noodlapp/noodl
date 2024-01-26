import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { AiIcon } from './AiIcon';

export default {
  title: 'Ai/Ai Icon',
  component: AiIcon,
  argTypes: {}
} as ComponentMeta<typeof AiIcon>;

const Template: ComponentStory<typeof AiIcon> = (args) => <AiIcon {...args} />;

export const Common = Template.bind({});
Common.args = {};
