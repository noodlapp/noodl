import classNames from 'classnames';
import React from 'react';

import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './PanelHeader.module.scss';

export interface PanelHeaderProps extends UnsafeStyleProps {
  title?: string;

  hasNoHeaderDivider?: boolean;

  children?: Slot;
}

export function PanelHeader({ title, hasNoHeaderDivider, children, UNSAFE_className, UNSAFE_style }: PanelHeaderProps) {
  return (
    <div
      className={classNames(css['Root'], hasNoHeaderDivider && css._hasNoHeaderDivider, UNSAFE_className)}
      style={UNSAFE_style}
    >
      <div className={css['Title']}>
        <Label size={LabelSize.Big}>{title}</Label>
      </div>
      <div className={css['Children']}>{children}</div>
    </div>
  );
}
