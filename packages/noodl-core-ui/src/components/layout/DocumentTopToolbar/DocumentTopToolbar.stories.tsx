import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { DocumentTopToolbar } from './DocumentTopToolbar';

export default {
  title: 'Layout/DocumentTopToolbar',
  component: DocumentTopToolbar,
  argTypes: {}
} as ComponentMeta<typeof DocumentTopToolbar>;

const Template: ComponentStory<typeof DocumentTopToolbar> = (args) => <DocumentTopToolbar {...args} />;

export const Common = Template.bind({});
Common.args = {};
