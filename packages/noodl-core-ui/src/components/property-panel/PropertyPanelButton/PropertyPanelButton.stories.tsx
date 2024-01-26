import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { PropertyPanelButton } from '@noodl-core-ui/components/property-panel/PropertyPanelButton';

export default {
  title: 'Property Panel/Button',
  component: PropertyPanelButton,
  argTypes: {}
} as ComponentMeta<typeof PropertyPanelButton>;

const Template: ComponentStory<typeof PropertyPanelButton> = (args) => (
  <div style={{ width: 280 }}>
    <PropertyPanelButton {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  properties: {
    buttonLabel: 'Verify API Key'
  }
};

export const Primary = Template.bind({});
Primary.args = {
  properties: {
    isPrimary: true,
    buttonLabel: 'Verify API Key'
  }
};
