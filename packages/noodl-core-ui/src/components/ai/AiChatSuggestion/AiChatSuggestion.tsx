import classNames from 'classnames';
import React, { MouseEventHandler, useEffect, useState } from 'react';

import { ActivityIndicator } from '@noodl-core-ui/components/common/ActivityIndicator';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Center } from '@noodl-core-ui/components/layout/Center';
import { Text } from '@noodl-core-ui/components/typography/Text';

import css from './AiChatSuggestion.module.scss';

export interface AiChatSuggestionProps {
  text?: string;
  isLoading?: boolean;

  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function AiChatSuggestion({ text, isLoading, onClick }: AiChatSuggestionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Box hasXSpacing hasYSpacing={1}>
      <div className={classNames([css['Root'], mounted ? css['Mounted'] : css['Mounting']])} onClick={onClick}>
        {isLoading ? (
          <Center>
            <ActivityIndicator />
          </Center>
        ) : (
          <Text>“{text}”</Text>
        )}
      </div>
    </Box>
  );
}
