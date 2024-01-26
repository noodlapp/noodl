import classNames from 'classnames';
import React, { MouseEventHandler } from 'react';

import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './Card.module.scss';

export enum CardPadding {
  Small = 'is-padding-small',
  Default = 'is-padding-default',
  Large = 'is-padding-large'
}

export enum CardBackground {
  Bg1 = 'is-bg-1',
  Bg2 = 'is-bg-2',
  Bg3 = 'is-bg-3',
  Bg4 = 'is-bg-4'
}

export interface CardProps extends UnsafeStyleProps {
  children: JSX.Element | JSX.Element[];
  padding?: CardPadding;
  background?: CardBackground;
  hoverBackground?: CardBackground;

  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function Card({
  children,
  padding = CardPadding.Default,
  background = CardBackground.Bg3,
  hoverBackground,

  onClick,

  UNSAFE_className,
  UNSAFE_style
}: CardProps) {
  return (
    <div
      style={UNSAFE_style}
      className={classNames(
        css.Root,
        css[padding],
        css[background],
        css[`${hoverBackground}-on-hover`],
        (Boolean(hoverBackground) || Boolean(onClick)) && css['has-hover-state'],
        UNSAFE_className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
