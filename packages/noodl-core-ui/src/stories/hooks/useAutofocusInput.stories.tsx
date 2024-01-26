import React, { useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { TextInput } from '@noodl-core-ui/components/inputs/TextInput';
import { useAutofocusInput } from '@noodl-core-ui/hooks/useAutofocusInput';

export default {
  title: 'Hooks/useAutofocusInput',
  component: TextInput,
  argTypes: {}
} as ComponentMeta<typeof TextInput>;

const Template: ComponentStory<typeof TextInput> = () => {
  const setRef = useAutofocusInput();
  const [secondInputState, setSecondInputState] = useState('Focus me manually');

  return (
    <>
      <TextInput onRefChange={setRef} value="Unmutable value makes this story cleaner" />
      <TextInput value={secondInputState} onChange={(e) => setSecondInputState(e.target.value)} />
    </>
  );
};

export const Common = Template.bind({});
Common.args = {};
