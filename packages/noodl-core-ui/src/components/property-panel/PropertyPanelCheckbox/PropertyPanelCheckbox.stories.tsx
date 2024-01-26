import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { PropertyPanelCheckbox } from '@noodl-core-ui/components/property-panel/PropertyPanelCheckbox';

export default {
  title: 'Property Panel/Checkbox',
  component: PropertyPanelCheckbox,
  argTypes: {}
} as ComponentMeta<typeof PropertyPanelCheckbox>;

const Template: ComponentStory<typeof PropertyPanelCheckbox> = (args) => (
  <div style={{ width: 280 }}>
    <PropertyPanelCheckbox {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {};
