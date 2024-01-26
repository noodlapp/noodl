import React from 'react';

import { Box } from '@noodl-core-ui/components/layout/Box';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { Title, TitleSize, TitleVariant } from '@noodl-core-ui/components/typography/Title';

import css from './LauncherPage.module.scss';

export interface LauncherPageProps {
  title: string;
  children?: JSX.Element | JSX.Element[];
  headerSlot?: JSX.Element | JSX.Element[];
}

export function LauncherPage({ title, children, headerSlot }: LauncherPageProps) {
  return (
    <div className={css['Root']}>
      <Box hasBottomSpacing={14}>
        <HStack UNSAFE_style={{ justifyContent: 'space-between' }}>
          <Title size={TitleSize.Large} variant={TitleVariant.Highlighted}>
            {title}
          </Title>
          <div>{headerSlot}</div>
        </HStack>
      </Box>
      {children}
    </div>
  );
}
