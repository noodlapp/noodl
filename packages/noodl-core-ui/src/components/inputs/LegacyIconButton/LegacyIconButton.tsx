import classNames from 'classnames';
import React, {
  CSSProperties,
  MouseEvent,
  MouseEventHandler,
  SyntheticEvent,
} from 'react';
import css from './LegacyIconButton.module.scss';

export enum LegacyIconButtonIcon {
  VerticalDots = 'vertical-dots',
  Close = 'close',
  CloseDark = 'close-dark',
  CaretDown = 'caret-down',
  Generate = 'generate',
}

export interface LegacyIconButtonProps {
  icon: LegacyIconButtonIcon;
  isRotated180?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
  testId?: string;
}

export function LegacyIconButton({
  icon,
  isRotated180,
  style,
  onClick,
  testId,
}: LegacyIconButtonProps) {
  return (
    <button
      className={css['Root']}
      onClick={onClick}
      style={style}
      data-test={testId}
    >
      <img
        className={classNames([
          css['Icon'],
          isRotated180 && css['is-rotated-180'],
        ])}
        src={`../assets/icons/icon-button/${icon}.svg`}
      />
    </button>
  );
}
