import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

import { Box } from '@noodl-core-ui/components/layout/Box';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Slot } from '@noodl-core-ui/types/global';

import css from './AiChatCard.module.scss';

export interface AiChatCardProps {
  title: string;
  subtitle?: string;
  children?: Slot;
}

export function AiChatCard({ title, subtitle, children }: AiChatCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Box hasXSpacing hasYSpacing={1}>
      <div className={classNames([css['Root'], mounted ? css['Mounted'] : css['Mounting']])}>
        <div className={css['Container']}>
          <Label size={LabelSize.Big} hasBottomSpacing>
            {title}
          </Label>
          {subtitle && <Text>{subtitle}</Text>}
        </div>
        {children}
      </div>
    </Box>
  );
}
