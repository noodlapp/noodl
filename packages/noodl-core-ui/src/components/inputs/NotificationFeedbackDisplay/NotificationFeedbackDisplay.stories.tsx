import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { NotificationFeedbackDisplay } from './NotificationFeedbackDisplay';

export default {
  title: 'Inputs/Notification Feedback Display',
  component: NotificationFeedbackDisplay,
  argTypes: {},
} as ComponentMeta<typeof NotificationFeedbackDisplay>;

const Template: ComponentStory<typeof NotificationFeedbackDisplay> = (args) => <NotificationFeedbackDisplay {...args} />;

export const Common = Template.bind({});
Common.args = {};
