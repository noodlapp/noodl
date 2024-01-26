import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { InputNotificationDisplayMode } from '@noodl-types/globalInputTypes';
import { FeedbackType } from '@noodl-constants/FeedbackType';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton } from '@noodl-core-ui/components/inputs/IconButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { VStack } from '@noodl-core-ui/components/layout/Stack';

import { TextInput } from './TextInput';

export default {
  title: 'Inputs/Text Input',
  component: TextInput,
  argTypes: {
    value: { summary: 'string' }
  }
} as ComponentMeta<typeof TextInput>;

const Template: ComponentStory<typeof TextInput> = (args) => <TextInput {...args} />;

export const Common = Template.bind({});
Common.args = {};

export const CopyMe = Template.bind({});
CopyMe.args = {
  value: 'Copy Me',
  isCopyable: true
};

export const ErrorMessage = Template.bind({});
ErrorMessage.args = {
  value: 'I got the error',
  notification: {
    type: FeedbackType.Danger,
    message: 'I am error!',
    displayMode: InputNotificationDisplayMode.Stay
  }
};

export const SuffixText: ComponentStory<typeof TextInput> = (args) => (
  <div>
    <Box hasBottomSpacing>
      <TextInput placeholder="placeholder" value="" suffix=".noodl.net" />
    </Box>
    <Box hasBottomSpacing>
      <TextInput value="example" suffix=".noodl.net" />
    </Box>
  </div>
);

export const SuffixSlotAfter = Template.bind({});
SuffixSlotAfter.args = {
  value: 'example',
  suffix: '.noodl.net',
  isCopyable: true,
  slotAfterInput: <IconButton icon={IconName.Bug} />
};

const StyleTestTemplate: ComponentStory<typeof TextInput> = (args) => (
  <div>
    <Box hasBottomSpacing>
      <TextInput {...args} />
    </Box>

    <VStack hasSpacing UNSAFE_style={{ maxWidth: '200px' }}>
      <TextInput {...args} />

      <TextInput {...args} isCopyable />

      <TextInput
        {...args}
        slotAfterInput={
          <Box hasLeftSpacing={1}>
            <IconButton icon={IconName.Bug} size={IconSize.Small} />
          </Box>
        }
      />

      <TextInput
        {...args}
        slotAfterInput={
          <Box hasLeftSpacing={1}>
            <IconButton icon={IconName.Bug} size={IconSize.Small} />
          </Box>
        }
        isCopyable
      />
    </VStack>
  </div>
);

export const StyleTestCommon = StyleTestTemplate.bind({});
StyleTestCommon.args = {
  value: 'How does my scrollbar look? How does my scrollbar look?'
};

export const StyleTestReadOnly = StyleTestTemplate.bind({});
StyleTestReadOnly.args = {
  isReadonly: true,
  value: 'You cannot change me! How does my scrollbar look?'
};

export const StyleTestDisabled = StyleTestTemplate.bind({});
StyleTestDisabled.args = {
  isDisabled: true,
  value: 'You cannot change me! How does my scrollbar look?'
};
