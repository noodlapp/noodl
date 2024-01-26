import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Card } from './Card';

export default {
  title: 'Common/Card',
  component: Card,
  argTypes: {}
} as ComponentMeta<typeof Card>;

const Template: ComponentStory<typeof Card> = (args) => <Card {...args} />;

export const Common = Template.bind({});
Common.args = {};
