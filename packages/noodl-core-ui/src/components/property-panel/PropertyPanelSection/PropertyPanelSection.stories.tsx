import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { PropertyPanelSection } from './PropertyPanelSection';

export default {
  title: 'Property Panel/Property Panel Section',
  component: PropertyPanelSection,
  argTypes: {}
} as ComponentMeta<typeof PropertyPanelSection>;

const Template: ComponentStory<typeof PropertyPanelSection> = (args) => <PropertyPanelSection {...args} />;

export const Common = Template.bind({});
Common.args = { title: 'Section title' };
