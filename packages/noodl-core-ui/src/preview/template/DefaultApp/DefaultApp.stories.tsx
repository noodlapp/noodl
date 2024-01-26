import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { DefaultApp } from "./DefaultApp";

export default {
  title: "Preview/Template/App",
  component: DefaultApp,
  argTypes: {},
} as ComponentMeta<typeof DefaultApp>;

const Template: ComponentStory<typeof DefaultApp> = (args) => (
  <DefaultApp {...args}></DefaultApp>
);

export const Common = Template.bind({});
Common.args = {};
