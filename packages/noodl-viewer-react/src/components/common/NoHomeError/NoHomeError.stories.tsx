import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { NoHomeError } from './NoHomeError';

export default {
  title: 'Common/NoHomeError',
  component: NoHomeError,
  argTypes: {}
} as ComponentMeta<typeof NoHomeError>;

const Template: ComponentStory<typeof NoHomeError> = () => <NoHomeError />;

export const Common = Template.bind({});
Common.args = {};
