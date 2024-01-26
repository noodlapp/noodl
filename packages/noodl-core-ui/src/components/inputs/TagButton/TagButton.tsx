import { UnsafeStyleProps } from '@noodl-core-ui/types/global';
import classNames from 'classnames';
import React from 'react';
import css from './TagButton.module.scss';

export interface TagButtonProps extends UnsafeStyleProps {
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

export function TagButton({
  label,
  onClick,
  isActive,
  UNSAFE_className,
  UNSAFE_style
}: TagButtonProps) {
  return (
    <button
      className={classNames(css['Root'], isActive && css['is-active'], UNSAFE_className)}
      onClick={onClick}
      style={UNSAFE_style}
    >
      {label}
    </button>
  );
}
