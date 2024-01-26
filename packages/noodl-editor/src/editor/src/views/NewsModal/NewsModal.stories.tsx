import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { NewsModal } from './NewsModal';

export default {
  title: 'CATEGORY_HERE/NewsModal',
  component: NewsModal,
  argTypes: {},
} as ComponentMeta<typeof NewsModal>;

const Template: ComponentStory<typeof NewsModal> = (args) => <NewsModal {...args} />;

export const Common = Template.bind({});
Common.args = {};