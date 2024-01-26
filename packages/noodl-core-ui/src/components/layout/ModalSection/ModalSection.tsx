import React from 'react';

import { InputLabelSection } from '@noodl-core-ui/components/inputs/InputLabelSection';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Slot } from '@noodl-core-ui/types/global';

import css from './ModalSection.module.scss';

export interface ModalSectionProps {
  children: Slot;

  label?: string;
}

export function ModalSection({ children, label }: ModalSectionProps) {
  return (
    <Box hasTopSpacing={2}>
      {label && <InputLabelSection label={label} />}
      <Box hasYSpacing hasXSpacing UNSAFE_className={css['Root']}>
        <VStack hasSpacing>{children}</VStack>
      </Box>
    </Box>
  );
}
