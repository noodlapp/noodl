import useParsedHref from '@noodl-hooks/useParsedHref';
import classNames from 'classnames';
import React, { MouseEventHandler, useState } from 'react';
import { platform } from '@noodl/platform';

import { FeedbackType } from '@noodl-constants/FeedbackType';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';
import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './TextButton.module.scss';

export enum TextButtonSize {
  Default = 'default',
  Small = 'small'
}

export interface TextButtonProps extends UnsafeStyleProps {
  label: string;
  variant?: FeedbackType | TextType;
  variantOnHover?: FeedbackType | TextType;
  size?: TextButtonSize;
  href?: string;
  icon?: IconName;

  onClick?: MouseEventHandler<HTMLButtonElement>;

  hasLeftSpacing?: boolean;
  hasRightSpacing?: boolean;

  testId?: string;
}

export function TextButton({
  label,
  variant,
  variantOnHover,
  size = TextButtonSize.Default,
  href,
  icon,
  hasLeftSpacing,
  hasRightSpacing,
  onClick,
  testId,
  UNSAFE_className,
  UNSAFE_style
}: TextButtonProps) {
  const parsedHref = useParsedHref(href);
  const [currentVariant, setCurrentVariant] = useState(variant);

  const iconSize = size === TextButtonSize.Default ? IconSize.Default : IconSize.Tiny;

  return (
    <button
      className={classNames([
        css['Root'],
        css[`is-size-${size}`],
        hasLeftSpacing && css['has-left-spacing'],
        hasRightSpacing && css['has-right-spacing'],
        css[`is-variant-${currentVariant}`],
        UNSAFE_className
      ])}
      onClick={(e) => {
        if (parsedHref) platform.openExternal(parsedHref);
        if (onClick) onClick(e);
      }}
      onMouseEnter={() => {
        if (!variantOnHover) return;
        setCurrentVariant(variantOnHover);
      }}
      onMouseLeave={() => {
        if (!variantOnHover) return;
        setCurrentVariant(variant);
      }}
      data-test={testId}
      style={UNSAFE_style}
    >
      {icon && <Icon icon={icon} size={iconSize} UNSAFE_style={{ marginRight: 4 }} />}{' '}
      <Text textType={currentVariant}>{label}</Text>
    </button>
  );
}
