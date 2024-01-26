import classNames from 'classnames';
import React from 'react';

import css from './PropertyPanelButton.module.scss';

export interface PropertyPanelButtonProps {
  properties: {
    isPrimary?: boolean;
    buttonLabel: string;
    onClick?: () => void;
  };
}

export function PropertyPanelButton({ properties }: PropertyPanelButtonProps) {
  return (
    <div className={css['Root']}>
      <button
        className={classNames([css['Button'], properties.isPrimary && css['is-primary']])}
        onClick={properties.onClick}
      >
        {properties.buttonLabel}
      </button>
    </div>
  );
}
