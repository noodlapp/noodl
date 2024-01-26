import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { PropertyPanelPasswordInput } from './PropertyPanelPasswordInput';

export default {
  title: 'Property Panel/Password',
  component: PropertyPanelPasswordInput,
  argTypes: {}
} as ComponentMeta<typeof PropertyPanelPasswordInput>;

const Template: ComponentStory<typeof PropertyPanelPasswordInput> = (args) => (
  <div style={{ width: 280 }}>
    <PropertyPanelPasswordInput {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  value: 'Hello World'
};
