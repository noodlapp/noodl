import React from 'react';

import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Text } from '@noodl-core-ui/components/typography/Text';

import css from './AiChatboxError.module.scss';

export interface AiChatboxErrorProps {
  title?: string;
  content: string;
}

export function AiChatboxError({ title = 'Aw, Snap!', content }: AiChatboxErrorProps) {
  return (
    <div className={css['Root']}>
      <Label size={LabelSize.Big} hasBottomSpacing>
        {title}
      </Label>
      <Text style={{ textAlign: 'center' }}>{content}</Text>
    </div>
  );
}
