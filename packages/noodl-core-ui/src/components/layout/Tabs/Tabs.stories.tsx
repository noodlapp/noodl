import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Tabs, TabsVariant } from './Tabs';
import { Text } from '@noodl-core-ui/components/typography/Text';

export default {
  title: 'Layout/Tabs',
  component: Tabs,
  argTypes: {}
} as ComponentMeta<typeof Tabs>;

const Template: ComponentStory<typeof Tabs> = (args) => (
  <div style={{ width: 280 }}>
    <Tabs {...args}></Tabs>
  </div>
);

export const Common = Template.bind({});
Common.args = {
  tabs: [
    {
      label: 'First tab',
      content: 'Some content for the first tab'
    },
    {
      label: 'Second tab',
      content: 'Second tab content!'
    }
  ]
};

export const VariantText = Template.bind({});
VariantText.args = {
  variant: TabsVariant.Text,
  tabs: [
    {
      label: 'First tab',
      content: <Text>Some content for the first tab</Text>
    },
    {
      label: 'Second tab',
      content: <Text>Second tab content!</Text>
    }
  ]
};

export const VariantSidebar = Template.bind({});
VariantSidebar.args = {
  variant: TabsVariant.Sidebar,
  tabs: [
    {
      label: 'First tab',
      content: <Text>Some content for the first tab</Text>
    },
    {
      label: 'Second tab',
      content: <Text>Second tab content!</Text>
    }
  ]
};

export const SettingTabsWithId = Template.bind({});
SettingTabsWithId.args = {
  tabs: [
    {
      label: 'Same label',
      content: <Text>I am the first tab with the same name</Text>,
      id: 'tab-1'
    },
    {
      label: 'Same label',
      content: <Text>I am the second tab with the same label</Text>,
      id: 2
    }
  ]
};
