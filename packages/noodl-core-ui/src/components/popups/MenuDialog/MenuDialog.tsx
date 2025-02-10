import classNames from 'classnames';
import React, { cloneElement, MouseEventHandler } from 'react';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { BaseDialog, BaseDialogProps } from '@noodl-core-ui/components/layout/BaseDialog';
import { Tooltip } from '@noodl-core-ui/components/popups/Tooltip';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';
import { SingleSlot, Slot } from '@noodl-core-ui/types/global';

import css from './MenuDialog.module.scss';

export enum MenuDialogWidth {
  Small = 'is-width-small',
  Default = 'is-width-default',
  Medium = 'is-width-medium',
  Large = 'is-width-large'
}

export interface MenuDialogItem {
  label?: string;
  component?: (doCloseMenu?: () => void) => SingleSlot;
  key?: string;
  icon?: IconName;
  endSlot?: Slot;

  tooltip?: string;
  tooltipShowAfterMs?: number;

  onClick?: MouseEventHandler<HTMLDivElement>;

  isDisabled?: boolean;
  isHidden?: boolean;
  isDangerous?: boolean;
  isHighlighted?: boolean;

  dontCloseMenuOnClick?: boolean;

  testId?: string;
}

export interface MenuDialogProps
  extends Pick<BaseDialogProps, 'isVisible' | 'onClose' | 'triggerRef' | 'renderDirection'> {
  items: (MenuDialogItem | 'divider')[];
  title?: string;
  width?: MenuDialogWidth;

  /**
   * TODO: Remove this in the future, but also allow to modify it a little.
   */
  UNSAFE_maxHeight?: string;
}

export function MenuDialog({
  items,
  title,
  width = MenuDialogWidth.Default,
  triggerRef,
  isVisible,
  renderDirection,
  UNSAFE_maxHeight,
  onClose
}: MenuDialogProps) {
  return (
    <BaseDialog
      isVisible={isVisible}
      onClose={onClose}
      triggerRef={triggerRef}
      title={title}
      renderDirection={renderDirection}
      isLockingScroll
      hasArrow
    >
      <div className={classNames(css['Root'], css[width])} style={{ maxHeight: UNSAFE_maxHeight }}>
        {items.filter(Boolean).map((item, i) => {
          if (item === 'divider') return <div className={css['Divider']} key={i} />;
          if (item?.isHidden) return null;

          const itemContent = (
            <div
              className={classNames(
                css['Item'],
                item.isDangerous && css['is-danger'],
                item.component && css['has-component'],
                item.isHighlighted && css['is-highlighted'],
                item.isDisabled && css['is-disabled']
              )}
              onClick={(e) => {
                if (item.isDisabled) return;
                if (!item.dontCloseMenuOnClick) onClose();
                if (!item.onClick) return;
                item.onClick(e);
              }}
              key={item.key || item.label}
              data-test={item.testId}
            >
              <div className={classNames(css['Label'], item.endSlot && css['has-bottom-spacing'])}>
                {item.icon && <Icon icon={item.icon} size={IconSize.Tiny} UNSAFE_className={css['Icon']} />}
                <Label variant={TextType.DefaultContrast} hasTextWrap>
                  {item.label}
                </Label>
              </div>
              {item.component && cloneElement(item.component(() => onClose()) as TSFixme)}
              <div className={css['EndSlot']}>
                {item.endSlot && typeof item.endSlot === 'string' && <Text>{item.endSlot}</Text>}
                {item.endSlot && typeof item.endSlot !== 'string' && item.endSlot}
              </div>
            </div>
          );

          return item.tooltip ? (
            <Tooltip content={item.tooltip} showAfterMs={item.tooltipShowAfterMs} key={item.key || item.label}>
              {itemContent}
            </Tooltip>
          ) : (
            itemContent
          );
        })}
      </div>
    </BaseDialog>
  );
}
