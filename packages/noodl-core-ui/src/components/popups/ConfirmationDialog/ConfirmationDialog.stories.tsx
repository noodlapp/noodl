import React, { useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { ConfirmationDialog } from './ConfirmationDialog';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { useConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';

export default {
  title: 'Popups/Confirmation Dialog',
  component: ConfirmationDialog,
  argTypes: {}
} as ComponentMeta<typeof ConfirmationDialog>;

const Template: ComponentStory<typeof ConfirmationDialog> = (args) => {
  const [isDialogVisible, setIsDialogVisible] = useState(args.isVisible);

  return (
    <>
      <PrimaryButton label="Toggle dialog" onClick={() => setIsDialogVisible(true)} />
      <ConfirmationDialog
        {...args}
        isVisible={isDialogVisible}
        onCancel={() => setIsDialogVisible(false)}
        onConfirm={() => setIsDialogVisible(false)}
      />
    </>
  );
};

export const Common = Template.bind({});
Common.args = {};

export const Usage: ComponentStory<typeof ConfirmationDialog> = (args) => {
  const [Dialog, handleConfirmation] = useConfirmationDialog({
    title: args.title || 'Please confirm your actions',
    message: args.message || 'Do you want to see an alert after this popup has been closed?',
    isDangerousAction: args.isDangerousAction
  });

  function onClick() {
    handleConfirmation()
      .then(() => {
        alert("Here's the alert you wanted to see!");
      })
      .catch(() => {
        alert("Too bad. I'm showing you an alert anyways");
      });
  }

  return (
    <>
      <Dialog />

      <Text hasBottomSpacing>
        The useConfirmationDialog hook returns a component and a promise. This promise can be used
        to handle the confirmation.
      </Text>

      <Text>The code in this instance looks like this:</Text>

      <pre>
        {`const [Dialog, handleConfirmation] = useConfirmationDialog({
  title: 'Please confirm your actions',
  message: 'Do you want to see an alert after this popup has been closed?',
});

function onClick() {
  handleConfirmation()
    .then(() => {
      alert("Here's the alert you wanted to see!");
    })
    .catch(() => {
      alert("Too bad. I'm showing you an alert anyways");
    });
}`}
      </pre>

      <PrimaryButton label="Click to trigger dialog" onClick={onClick} />
    </>
  );
};
