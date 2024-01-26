import classNames from 'classnames';
import React, { MouseEventHandler } from 'react';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';

import css from './ToolbarGrip.module.scss';

export interface ToolbarGripProps {
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
}

export function ToolbarGrip({ onMouseDown }: ToolbarGripProps) {
  return (
    <button
      className={classNames([css['Root']])}
      onMouseDown={(e) => {
        if (onMouseDown) onMouseDown(e);
      }}
    >
      <Icon icon={IconName.Grip} size={IconSize.Default} />
    </button>
  );
}
