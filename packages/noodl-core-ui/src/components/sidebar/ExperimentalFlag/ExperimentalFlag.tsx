import React from 'react';

import { FeedbackType } from '@noodl-constants/FeedbackType';

import { Box } from '@noodl-core-ui/components/layout/Box';
import { Text } from '@noodl-core-ui/components/typography/Text';

export enum ExperimentalFlagVariant {
  Default,
  Small,
  NoPadding
}

export interface ExperimentalFlagProps {
  variant?: ExperimentalFlagVariant;
  text?: string;
}

export function ExperimentalFlag({
  variant = ExperimentalFlagVariant.Default,
  text = 'Please note that this feature is untested and may lead to instability or lost work. Proceed with caution!'
}: ExperimentalFlagProps) {
  if (variant === ExperimentalFlagVariant.Small) {
    return (
      <Box hasXSpacing hasBottomSpacing hasTopSpacing={1}>
        <Text textType={FeedbackType.Notice}>{text}</Text>
      </Box>
    );
  }

  if (variant === ExperimentalFlagVariant.NoPadding) {
    return (
      <Box hasBottomSpacing={6}>
        <Text textType={FeedbackType.Notice}>{text}</Text>
      </Box>
    );
  }

  return (
    <Box hasXSpacing hasBottomSpacing hasTopSpacing>
      <Text textType={FeedbackType.Notice}>{text}</Text>
    </Box>
  );
}
