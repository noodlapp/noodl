import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { ActionButton, ActionButtonVariant } from './ActionButton';
import { IconName } from '@noodl-core-ui/components/common/Icon';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';
import { Container } from '@noodl-core-ui/components/layout/Container';

export default {
  title: 'Inputs/Action Button',
  component: ActionButton,
  argTypes: {}
} as ComponentMeta<typeof ActionButton>;

const Template: ComponentStory<typeof ActionButton> = (args) => (
  <div style={{ width: 280 }}>
    <ActionButton {...args}></ActionButton>
  </div>
);

export const Common = Template.bind({});
Common.args = {};

export const UpToDate = Template.bind({});
UpToDate.args = {
  variant: ActionButtonVariant.Default,
  label: 'Up to date',
  value: 'Last updated 14:39'
};

export const ReceivingUpdates = Template.bind({});
ReceivingUpdates.args = {
  variant: ActionButtonVariant.BackgroundAction,
  label: 'Receiving updates',
  affixText: '75%'
};

export const CheckingForUpdates = Template.bind({});
CheckingForUpdates.args = {
  variant: ActionButtonVariant.BackgroundAction,
  label: 'Checking for updates...',
  affixText: 'Last updated 14:39'
};

export const PullChanges = Template.bind({});
PullChanges.args = {
  variant: ActionButtonVariant.CallToAction,
  icon: IconName.ArrowDown,
  label: 'Pull changes',
  affixText: 'Last updates just now'
};

export const PushChanges = Template.bind({});
PushChanges.args = {
  variant: ActionButtonVariant.CallToAction,
  icon: IconName.ArrowUp,
  label: 'Push changes',
  affixText: 'Last updates just now'
};

export const Back = Template.bind({});
Back.args = {
  variant: ActionButtonVariant.Default,
  icon: IconName.ArrowLeft,
  label: 'Back',
  affixText: undefined
};

export const ComparingBranches = Template.bind({});
ComparingBranches.args = {
  variant: ActionButtonVariant.Proud,
  icon: IconName.ArrowLeft,
  prefixText: 'Comparing',
  label: (
    <Container>
      <Text textType={TextType.Proud} isSpan>
        Branch v2
      </Text>
      <Text textType={TextType.Default} isSpan style={{ padding: '0 4px' }}>
        with
      </Text>
      <Text textType={TextType.Proud} isSpan>
        Main
      </Text>
    </Container>
  ),
  affixText: undefined
};
