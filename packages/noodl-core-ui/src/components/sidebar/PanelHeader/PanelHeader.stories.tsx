import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { PanelHeader } from './PanelHeader';

export default {
  title: 'Sidebar/Panel Header',
  component: PanelHeader,
  argTypes: {}
} as ComponentMeta<typeof PanelHeader>;

const Template: ComponentStory<typeof PanelHeader> = (args) => (
  <div style={{ width: 280 }}>
    <PanelHeader {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {};

export const Example = Template.bind({});
Example.args = {
  title: 'Hello World'
};
