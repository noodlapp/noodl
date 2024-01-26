import React, { useState } from 'react';
import { ListItem, ListItemProps } from '@noodl-core-ui/components/layout/ListItem/ListItem';
import { ContextMenu, ContextMenuProps } from '@noodl-core-ui/components/popups/ContextMenu';
import { Icon, IconName } from '@noodl-core-ui/components/common/Icon';

export type ListItemMenuProps = Exclude<
  ListItemProps,
  'isShowingAffixOnHover' | 'affix' | 'isHover'
> & {
  menuIcon?: IconName;
  menuItems: ContextMenuProps['menuItems'];

  alwaysShowAffixIcon?: boolean;
};

/**
 * Component building on top of **ListItem** to make it
 * easier to use **ContextMenu** as affix.
 *
 * When there are no **menuItems** it will fallback to show the **menuIcon**.
 */
export function ListItemMenu(args: ListItemMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  let isShowingAffixOnHover = !isOpen;
  if (typeof args.alwaysShowAffixIcon === 'boolean' && args.alwaysShowAffixIcon) {
    isShowingAffixOnHover = false;
  }

  return (
    <ListItem
      {...args}
      isHover={isOpen}
      isShowingAffixOnHover={isShowingAffixOnHover}
      onClick={(ev) => !isOpen && args.onClick && args.onClick(ev)}
      affix={
        args.isDisabled ? null : args.menuItems.length === 0 ? (
          <Icon icon={args.menuIcon} />
        ) : (
          <ContextMenu
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            menuItems={args.menuItems || []}
          />
        )
      }
    />
  );
}
