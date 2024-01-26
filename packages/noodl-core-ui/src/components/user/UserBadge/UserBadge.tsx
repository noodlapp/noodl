import classNames from 'classnames';
import React from 'react';

import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import { getBadgeAndNameForUser } from '../../../utils/collaborator';
import css from './UserBadge.module.scss';

export enum UserBadgeSize {
  Medium = 'medium',
  Small = 'small',
  Tiny = 'tiny'
}

export interface UserBadgeProps extends UnsafeStyleProps {
  size?: UserBadgeSize;

  name: string;
  email: string;
  id: string;

  hasRightSpacing?: boolean;
}

export function UserBadge({
  size = UserBadgeSize.Medium,

  name,
  email,
  id,

  hasRightSpacing,

  UNSAFE_className,
  UNSAFE_style
}: UserBadgeProps) {
  const badgeData = getBadgeAndNameForUser({ name, email, id });

  return (
    <div
      className={classNames([
        css['Root'],
        css[`is-size-${size}`],
        hasRightSpacing && css['has-right-spacing'],
        UNSAFE_className
      ])}
      style={{ backgroundColor: badgeData.badge.color, ...UNSAFE_style }}
    >
      <span>{badgeData.badge.label}</span>
    </div>
  );
}
