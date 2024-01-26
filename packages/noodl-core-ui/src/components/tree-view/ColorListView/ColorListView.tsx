import classNames from 'classnames';
import React from 'react';

import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';
import {
  TreeView,
  TreeViewChildProps,
  TreeViewItem,
  TreeViewItemDraggable,
  TreeViewProps,
  useTreeViewContext
} from '@noodl-core-ui/components/tree-view/TreeView/TreeView';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { TextType } from '@noodl-core-ui/components/typography/Text';
import { Slot } from '@noodl-core-ui/types/global';

import css from './ColorListView.module.scss';

export interface BasicNodeItem extends TreeViewItem<BasicNodeItem> {
  endSlot?: Slot;
  text: string;
  color: string;
}

export interface BasicNodeProps extends TreeViewChildProps<BasicNodeItem> {}

function ColorListItem({ depth, item, children, onClick }: BasicNodeProps) {
  const context = useTreeViewContext();

  const isDropSpot = context.dropSpot === item.id.toString();
  const isExpanded = typeof item.isExpanded === 'undefined' || item.isExpanded;
  const isActive = item.id === context.activeItemId;

  return (
    <div key={item.id}>
      <TreeViewItemDraggable
        id={item.id}
        className={classNames([css['DraggableItem'], isActive && css['is-active']])}
        onClick={() => {
          onClick && onClick();
        }}
      >
        <div
          className={classNames([css['Item']])}
          style={{
            paddingLeft: `calc(${depth + 1} * 16px + ${2 * depth}px)`
          }}
        >
          <div className={classNames(css['ColorItem'])}>
            <div
              className={classNames([css['ColorItem_Block']])}
              style={{
                background: item.color || 'black'
              }}
            ></div>
          </div>
          <div className={classNames([css['ItemText']])}>
            <Label>{item.text}</Label>
            {item.text !== item.color && <Label variant={TextType.Shy}>{item.color}</Label>}
          </div>
          {item.endSlot && <div className={css['EndSlotContainer']}>{item.endSlot}</div>}
        </div>
      </TreeViewItemDraggable>

      <div
        style={{
          height: '2px',
          padding: '0 8px'
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

export interface ColorListViewProps extends Exclude<TreeViewProps<BasicNodeItem>, 'node'> {}

export function ColorListView({ items, onChanged, onItemDrop }: ColorListViewProps) {
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
      node={ColorListItem}
      onItemClick={onItemClick}
      onChanged={onChanged}
      onItemDrop={onItemDrop}
    />
  );
}
