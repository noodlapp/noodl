import React from 'react';

import { AiIconAnimated } from '@noodl-core-ui/components/ai/AiIconAnimated';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { Text } from '@noodl-core-ui/components/typography/Text';

import css from './AiChatLoader.module.scss';

export interface AiChatLoaderProps {
  text?: string;
}

export function AiChatLoader({ text = 'Thinking...' }: AiChatLoaderProps) {
  return (
    <Box hasXSpacing hasYSpacing={1} UNSAFE_className={css['Root']}>
      <HStack UNSAFE_style={{ minHeight: '18px' }}>
        <AiIconAnimated isListening UNSAFE_style={{ marginLeft: '-13px', marginRight: '5px' }} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text>{text}</Text>
        </div>
      </HStack>
    </Box>
  );
}
