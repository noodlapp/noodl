import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { PopupSection } from './PopupSection';
import { Text } from '@noodl-core-ui/components/typography/Text';

export default {
  title: 'Popups/Popup Section',
  component: PopupSection,
  argTypes: {}
} as ComponentMeta<typeof PopupSection>;

const Template: ComponentStory<typeof PopupSection> = (args) => (
  <div style={{ width: 280 }}>
    <PopupSection {...args}>
      <Text>
        {
          // @ts-ignore
          args.content
        }
      </Text>
    </PopupSection>
  </div>
);

export const Common = Template.bind({});
Common.args = {
  title: 'Cloud services'
};

export const WithContent = Template.bind({});
WithContent.args = {
  content:
    'Create a new backend. Each backend is isolated so you can create one for development, testing and production, or for different locales.'
};
