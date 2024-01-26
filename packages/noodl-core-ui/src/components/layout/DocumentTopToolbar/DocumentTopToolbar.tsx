import React, { ReactNode } from 'react';

import css from './DocumentTopToolbar.module.scss';

export interface DocumentTopToolbarProps {
  children: ReactNode | ReactNode[];
}

/**
 * @example
 *    <DocumentTopToolbar>
 *      <Label hasLeftSpacing>Page Structure Overview</Label>
 *      <div style={{ marginLeft: 'auto' }}>
 *        <PrimaryButton label="Exit" variant={PrimaryButtonVariant.MutedOnLowBg} />
 *      </div>
 *    </DocumentTopToolbar>
 */
export function DocumentTopToolbar({ children }: DocumentTopToolbarProps) {
  return <div className={css.Root}>{children}</div>;
}
