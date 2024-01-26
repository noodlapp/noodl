import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { PropertyPanelTextInput } from './PropertyPanelTextInput';

export default {
  title: 'Property Panel/Text',
  component: PropertyPanelTextInput,
  argTypes: {}
} as ComponentMeta<typeof PropertyPanelTextInput>;

const Template: ComponentStory<typeof PropertyPanelTextInput> = (args) => (
  <div style={{ width: 280 }}>
    <PropertyPanelTextInput {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  value: 'Hello World'
};
