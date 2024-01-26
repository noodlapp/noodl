import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Title } from './Title';

export default {
  title: 'Typography/Title',
  component: Title,
  argTypes: {
    children: { control: 'text' },
    size: {
      control: {
        type: 'select',
        options: [
          'default',
          'large',
          'small',
        ],
      },
    },
    variant: {
      control: {
        type: 'select',
        options: [
          'default',
          'highlighted',
          'danger',
          'success',
        ],
      },
    },
  
    hasBottomSpacing: { control: 'boolean' },
    isCentered: { control: 'boolean' },
    isInline: { control: 'boolean' },
  },
} as ComponentMeta<typeof Title>;

const Template: ComponentStory<typeof Title> = (args) => <Title {...args}>{args.children}</Title>;

export const Common = Template.bind({});
Common.args = {
  children: "Typography",
};
