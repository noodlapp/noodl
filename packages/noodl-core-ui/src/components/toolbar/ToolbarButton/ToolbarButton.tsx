import React, { MouseEventHandler } from 'react';
import { Text } from '@noodl-core-ui/components/typography/Text';
import classNames from 'classnames';

import css from './ToolbarButton.module.scss';

export interface ToolbarButtonProps {
  label: string;
  prefix?: JSX.Element;

  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function ToolbarButton({ label, prefix, onClick }: ToolbarButtonProps) {
  return (
    <button
      className={classNames([css['Root'], onClick && css['actionable']])}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
    >
      {prefix}
      <Text className={classNames([css['Text'], onClick && css['actionable']])}>
        {label}
      </Text>
    </button>
  );
}
