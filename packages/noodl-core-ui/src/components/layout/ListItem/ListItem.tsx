import classNames from 'classnames';
import React from 'react';

import { Icon, IconName, IconProps, IconSize } from '@noodl-core-ui/components/common/Icon';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';
import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './ListItem.module.scss';

export enum ListItemVariant {
  Default = 'default',
  DefaultContrast = 'default-contrast',
  Active = 'active',
  Shy = 'shy',
  Highlighted = 'highlighted',
  HighlightedShy = 'highlighted-shy'
}

export interface ListItemProps extends UnsafeStyleProps {
  icon?: IconName;
  iconVariant?: IconProps['variant'];
  variant?: ListItemVariant;
  text: string;

  hasHiddenIconSlot?: boolean;

  isDisabled?: boolean;
  /** Force hover state */
  isHover?: boolean;

  isActive?: boolean;

  children?: Slot;

  gutter?: number;

  prefix?: Slot;
  affix?: Slot;
  isShowingAffixOnHover?: boolean;

  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function ListItem({
  icon,
  iconVariant,
  variant = ListItemVariant.Default,
  text,

  isDisabled,
  isHover,
  isActive,

  hasHiddenIconSlot,

  children,

  gutter = 0,

  prefix,
  affix,
  isShowingAffixOnHover,

  UNSAFE_className,
  UNSAFE_style,

  onClick
}: ListItemProps) {
  const textVariant = listItemVariantToTextVariant(variant);

  return (
    <div
      className={classNames([
        css['Root'],
        isDisabled && css['is-disabled'],
        isHover && css['is-hover'],
        css[`is-variant-${variant}`],
        isShowingAffixOnHover && css['is-showing-affix-on-hover'],
        isActive && css['is-active'],
        UNSAFE_className
      ])}
      style={{
        paddingLeft: 4 * gutter + 'px',
        paddingRight: 4 * gutter + 'px',
        ...(UNSAFE_style || {})
      }}
      onClick={onClick}
    >
      {!hasHiddenIconSlot && (
        <div className={classNames([css['Prefix']])}>
          {Boolean(icon) && <Icon icon={icon} size={IconSize.Small} variant={iconVariant} />}
          {Boolean(prefix) && prefix}
        </div>
      )}
      <div className={classNames([css['Body']])}>
        <Text textType={textVariant}>{text}</Text>
        {children}
      </div>
      {Boolean(affix) && <div className={classNames([css['Affix']])}>{affix}</div>}
    </div>
  );
}

function listItemVariantToTextVariant(variant: ListItemVariant) {
  switch (variant) {
    case ListItemVariant.Shy:
    case ListItemVariant.HighlightedShy:
      return TextType.Shy;
    case ListItemVariant.DefaultContrast:
      return TextType.DefaultContrast;
    default:
      return TextType.Default;
  }
}
