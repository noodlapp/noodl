import classNames from 'classnames';
import React from 'react';

import { ActivityIndicator } from '@noodl-core-ui/components/common/ActivityIndicator';
import { PanelHeader, PanelHeaderProps } from '@noodl-core-ui/components/sidebar/PanelHeader';
import { Slot } from '@noodl-core-ui/types/global';

import css from './BasePanel.module.scss';

export interface BasePanelProps extends PanelHeaderProps {
  hasActivityBlocker?: boolean;
  hasContentScroll?: boolean;
  hasNoHeaderDivider?: boolean;

  /** Set the content size to be 100% height. */
  isFill?: boolean;
  headerSlot?: Slot;
  footerSlot?: Slot;
  children: Slot;

  /** TODO: Only used for testing Copilot */
  UNSAFE_content_style?: React.CSSProperties;
}

export function BasePanel({
  title,
  hasActivityBlocker,
  hasContentScroll,
  hasNoHeaderDivider,

  isFill,
  headerSlot,
  footerSlot,
  children,

  UNSAFE_className,
  UNSAFE_style,
  UNSAFE_content_style
}: BasePanelProps) {
  return (
    <div className={classNames(css['Root'], UNSAFE_className)} style={UNSAFE_style}>
      {Boolean(title) && (
        <PanelHeader hasNoHeaderDivider={hasNoHeaderDivider} title={title}>
          {headerSlot}
        </PanelHeader>
      )}

      <div className={css['Inner']}>
        <div
          className={classNames(
            css['ChildrenContainer'],
            hasContentScroll && css['has-content-scroll'],
            isFill && css['is-fill']
          )}
          style={UNSAFE_content_style}
        >
          {children}
        </div>
        {footerSlot && <div className={css['Footer']}>{footerSlot}</div>}
      </div>

      {hasActivityBlocker && <ActivityIndicator isOverlay />}
    </div>
  );
}
