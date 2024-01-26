import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { PropertyPanelNumberInput } from './PropertyPanelNumberInput';

export default {
  title: 'Property Panel/Number',
  component: PropertyPanelNumberInput,
  argTypes: {}
} as ComponentMeta<typeof PropertyPanelNumberInput>;

const Template: ComponentStory<typeof PropertyPanelNumberInput> = (args) => (
  <div style={{ width: 280 }}>
    <PropertyPanelNumberInput {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {};
