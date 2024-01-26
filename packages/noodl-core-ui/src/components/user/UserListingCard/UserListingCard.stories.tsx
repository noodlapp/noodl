import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { UserListingCard } from './UserListingCard';

export default {
  title: 'User/User Listing Card',
  component: UserListingCard,
  argTypes: {
    name: { control: 'text' },
    email: { control: 'text' },
    id: { control: 'text' },
    metaText: { control: 'slot' },
    metaType: {
      control: {
        type: 'select',
        options: [
          'default',
          'disabled',
          'shy',
          'proud',
        ],
      },
    },
    interactionSlot: { control: 'slot' },
    isLoading: { control: 'boolean' },
  },
} as ComponentMeta<typeof UserListingCard>;

const Template: ComponentStory<typeof UserListingCard> = (args) => <UserListingCard {...args} />;

export const Common = Template.bind({});
Common.args = {
  name: 'John Doe',
  email: 'john@noodl.net',
  id: '20',
};
