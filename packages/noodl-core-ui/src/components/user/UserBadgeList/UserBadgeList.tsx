import React from 'react';

import { Tooltip } from '@noodl-core-ui/components/popups/Tooltip';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { TextType } from '@noodl-core-ui/components/typography/Text';
import { UserBadge, UserBadgeProps } from '@noodl-core-ui/components/user/UserBadge/UserBadge';

import css from './UserBadgeList.module.scss';

export interface UserBadgeListProps {
  badges: UserBadgeProps[];
  size: UserBadgeProps['size'];
  maxVisible?: number;
}

export function UserBadgeList({ badges, size, maxVisible }: UserBadgeListProps) {
  const itemsToRender = Boolean(maxVisible) ? badges.slice(0, maxVisible) : badges;
  const hiddenItems = Boolean(maxVisible) ? badges.slice(maxVisible) : [];
  const hiddenPeople = hiddenItems.map((badge) => badge.name).join(', ');
  const restItemsAmount = Boolean(maxVisible) ? badges.length - maxVisible : 0;

  return (
    <div className={css['Root']}>
      {itemsToRender.map((badge, i) => (
        <Tooltip content={badge.name} fineType={badge.email} key={badge.id}>
          <UserBadge
            email={badge.email}
            name={badge.name}
            id={badge.id}
            size={size}
            UNSAFE_style={{ marginLeft: i > 0 ? '-6px' : null, border: '1px solid var(--theme-color-bg-2)' }}
          />
        </Tooltip>
      ))}

      {restItemsAmount > 0 && (
        <Tooltip content={hiddenPeople}>
          <Label hasLeftSpacing variant={TextType.Shy}>
            + {restItemsAmount} more
          </Label>
        </Tooltip>
      )}
    </div>
  );
}
