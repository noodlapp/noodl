import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Page } from './Page';

export default {
  title: 'Navigation/Page',
  component: Page,
  argTypes: {},
} as ComponentMeta<typeof Page>;

const Template: ComponentStory<typeof Page> = (args) => <Page {...args} />;

export const Common = Template.bind({});
Common.args = {};
