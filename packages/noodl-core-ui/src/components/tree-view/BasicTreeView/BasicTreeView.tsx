import classNames from 'classnames';
import React from 'react';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';
import {
  TreeView,
  TreeViewChildProps,
  TreeViewItem,
  TreeViewItemDraggable,
  TreeViewProps,
  useTreeViewContext
} from '@noodl-core-ui/components/tree-view/TreeView/TreeView';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Slot } from '@noodl-core-ui/types/global';

import css from './BasicTreeView.module.scss';

export enum ComponentListIconName {
  PageComponent = IconName.File,
  HomeComponent = IconName.Home,
  Folder = IconName.FolderClosed,
  Component = IconName.Components,
  ComponentWithChildren = IconName.ComponentsFill,
  NestedComponent = IconName.NestedComponent
}
export interface BasicNodeItem extends TreeViewItem<BasicNodeItem> {
  icon: IconName | ComponentListIconName;
  endSlot?: Slot;
  text: string;
}

export interface BasicNodeProps extends TreeViewChildProps<BasicNodeItem> {}

function BasicNode({ depth, item, children, onClick }: BasicNodeProps) {
  const context = useTreeViewContext();

  const isDropSpot = context.dropSpot === item.id.toString();
  const isExpanded = typeof item.isExpanded === 'undefined' || item.isExpanded;
  const isActive = item.id === context.activeItemId;

  const itemIcon = () => {
    if (item.icon !== ComponentListIconName.Folder) return item.icon as IconName;

    if (isExpanded) return IconName.FolderOpen;

    return IconName.FolderClosed;
  };

  return (
    <div key={item.id}>
      <TreeViewItemDraggable
        id={item.id}
        className={classNames([css['DraggableItem'], isActive ? css['is-active'] : css['is-not-active']])}
        onClick={() => {
          onClick && onClick();
          item.icon !== ComponentListIconName.Folder && context.setActiveItemId(item.id);
        }}
      >
        <div
          className={classNames([css['Item']])}
          style={{
            paddingLeft: `calc(${depth + 1} * 16px + ${2 * depth}px)`
          }}
        >
          <Icon icon={itemIcon()} size={IconSize.Tiny} />
          <div className={classNames([css['ItemText']])}>
            <Text>{item.text}</Text>
          </div>
        </div>

        {item.endSlot && <div className={css['EndSlotContainer']}>{item.endSlot}</div>}
      </TreeViewItemDraggable>

      <div
        style={{
          height: '2px',
          padding: '0 8px',
          background: 'var(--theme-color-bg-2)'
        }}
      >
        {isDropSpot && (
          <div
            style={{
              height: '100%',
              width: '100%',
              background: 'var(--theme-color-secondary-highlight)'
            }}
          ></div>
        )}
      </div>

      <Collapsible isCollapsed={!isExpanded}>{children}</Collapsible>
    </div>
  );
}

export interface BasicTreeViewProps extends Exclude<TreeViewProps<BasicNodeItem>, 'node'> {
  itemSlot?: (props: BasicNodeProps) => JSX.Element;
}

export function BasicTreeView({ items, itemSlot, onChanged, onItemDrop }: BasicTreeViewProps) {
  function onItemClick(item: BasicNodeItem) {
    if (item.children) {
      if (typeof item.isExpanded === 'undefined') {
        item.isExpanded = false;
      } else {
        item.isExpanded = !item.isExpanded;
      }
    }
  }

  return (
    <TreeView
      items={items}
      node={itemSlot ?? BasicNode}
      onItemClick={onItemClick}
      onChanged={onChanged}
      onItemDrop={onItemDrop}
    />
  );
}
