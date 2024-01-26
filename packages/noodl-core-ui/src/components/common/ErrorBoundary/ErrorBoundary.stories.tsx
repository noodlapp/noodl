import React from 'react';
import { ComponentMeta } from '@storybook/react';

import { ErrorBoundary } from './ErrorBoundary';
import { Text } from '@noodl-core-ui/components/typography/Text';

export default {
  title: 'Common/Error Boundary',
  component: ErrorBoundary,
  argTypes: {}
} as ComponentMeta<typeof ErrorBoundary>;

export const Common = (args) => (
  <ErrorBoundary {...args}>
    <Text>Everything working fine</Text>
  </ErrorBoundary>
);

function CauseError(): JSX.Element {
  let invalid_object = {};

  // @ts-ignore
  invalid_object.value.toThrowError();

  return <Text>Everything working fine</Text>;
}

export const OnError = (args) => (
  <ErrorBoundary {...args}>
    <CauseError />
  </ErrorBoundary>
);
