import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { HtmlRenderer } from './HtmlRenderer';
import { Text } from '@noodl-core-ui/components/typography/Text';

export default {
  title: 'Common/HtmlRenderer',
  component: HtmlRenderer,
  argTypes: {}
} as ComponentMeta<typeof HtmlRenderer>;

const Template: ComponentStory<typeof HtmlRenderer> = (args) => (
  <>
    <Text>Pass an HTML string to the html-prop</Text>
    <HtmlRenderer {...args} />;
  </>
);

export const Common = Template.bind({});
Common.args = {};
