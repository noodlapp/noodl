import { Slot } from '@noodl-core-ui/types/global';
import classNames from 'classnames';
import React from 'react';
import css from './PropertyPanelSection.module.scss';

export interface PropertyPanelSectionProps {
  title: string;
  children: Slot;
  hasNoBottomPadding?: boolean;
}

export function PropertyPanelSection({
  title,
  children,
  hasNoBottomPadding
}: PropertyPanelSectionProps) {
  return (
    <div className={classNames(css['Root'], hasNoBottomPadding && css['has-no-bottom-padding'])}>
      <header className={css['Header']}>{title}</header>
      <div className={css['Items']}>{children}</div>
    </div>
  );
}
