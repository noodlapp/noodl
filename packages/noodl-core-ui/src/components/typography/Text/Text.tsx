import classNames from 'classnames';
import React, { CSSProperties } from 'react';
import { FeedbackType } from '@noodl-constants/FeedbackType';
import css from './Text.module.scss';
import { Slot } from '@noodl-core-ui/types/global';

export enum TextType {
  Default = 'default',
  DefaultContrast = 'default-contrast',
  Disabled = 'disabled',
  Shy = 'shy',
  Proud = 'proud',
  Secondary = 'secondary'
}

export enum TextSize {
  Default = 'default',
  Small = 'small',
  Medium = 'medium'
}

export interface TextProps {
  children?: Slot;
  textType?: TextType | FeedbackType;
  className?: string;
  size?: TextSize;
  style?: CSSProperties;

  hasBottomSpacing?: boolean;
  isSpan?: boolean;
  isCentered?: boolean;

  testId?: string;
}

export function Text({
  children,
  textType = TextType.Default,
  size = TextSize.Default,
  style,
  className,
  hasBottomSpacing,
  isSpan,
  isCentered,
  testId
}: TextProps) {
  const Tag = isSpan ? 'span' : 'p';

  return (
    <Tag
      className={classNames([
        css['Root'],
        css[`is-type-${textType}`],
        css[`is-size-${size}`],
        isSpan && css['is-inline'],
        isCentered && css['is-centered'],
        hasBottomSpacing && css['has-bottom-spacing'],
        className
      ])}
      style={style}
      data-test={testId}
    >
      {children}
    </Tag>
  );
}
