import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { Logo, LogoVariant } from "./Logo";

export default {
  title: "Common/Logo",
  component: Logo,
  argTypes: {},
} as ComponentMeta<typeof Logo>;

const Template: ComponentStory<typeof Logo> = (args) => (
  <div style={{ padding: '10px' }}>
    <Logo {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {};

export const Inverted = Template.bind({});
Inverted.args = {
  variant: LogoVariant.Inverted
};

export const Grayscale = Template.bind({});
Grayscale.args = {
  variant: LogoVariant.Grayscale
};
