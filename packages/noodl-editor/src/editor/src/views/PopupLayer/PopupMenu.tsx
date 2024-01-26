import React from 'react';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { ListItem, ListItemVariant } from '@noodl-core-ui/components/layout/ListItem';

import { ReactView, ReactViewDefaultProps } from '../../../../shared/ReactView';

export interface PopupMenuItem {
  type?: 'divider' | 'item';
  icon?: IconName;
  label?: string;
  onClick?: () => void;
}

export interface PopupMenuProps extends ReactViewDefaultProps {
  items: PopupMenuItem[];
}

export class PopupMenu extends ReactView<PopupMenuProps> {
  constructor(props: PopupMenuProps) {
    super(props);
  }

  protected renderReact({ items, owner }: PopupMenuProps): JSX.Element {
    return (
      <div className="popup-layer-popup-menu">
        {items.map((item, index) => {
          if (item.type === 'divider') {
            return <div key={index} className="popup-layer-popup-menu-divider"></div>;
          }

          function onClick(evt: React.MouseEvent<HTMLDivElement>) {
            owner && owner.hidePopup();
            item.onClick && item.onClick();
            evt.stopPropagation();
            evt.preventDefault();
          }

          return (
            <ListItem
              key={index}
              onClick={onClick}
              icon={item.icon}
              text={item.label}
              variant={ListItemVariant.DefaultContrast}
            />
          );
        })}
      </div>
    );
  }
}
