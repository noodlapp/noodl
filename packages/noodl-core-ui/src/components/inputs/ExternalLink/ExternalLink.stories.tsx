import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { ExternalLink } from './ExternalLink';

export default {
  title: 'Inputs/External Link',
  component: ExternalLink,
  argTypes: {}
} as ComponentMeta<typeof ExternalLink>;

const Template: ComponentStory<typeof ExternalLink> = (args) => <ExternalLink {...args} />;

export const Common = Template.bind({});
Common.args = { children: 'I am a link' };
