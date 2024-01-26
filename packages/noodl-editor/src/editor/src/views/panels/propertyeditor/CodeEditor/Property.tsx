import React, { MouseEventHandler } from 'react';

import Tooltip from '../../../../reactcomponents/tooltip';

export interface PropertyProps {
  isPrimary: boolean;
  displayName: string;
  tooltip: string;
  isDefault: boolean;

  onClick: MouseEventHandler<HTMLButtonElement>;
}

export function Property({ isPrimary, displayName, tooltip, isDefault, onClick }: PropertyProps) {
  return (
    <div data-template="codeeditor" data-primary={isPrimary} style={{ height: '35px', position: 'relative' }}>
      <Tooltip enabled={!!tooltip} text={tooltip}>
        <label className="property-label">{displayName}</label>
      </Tooltip>

      <div className="property-value">
        <button
          type="button"
          style={{ width: '100%', height: '100%' }}
          className="property-codeeditor-button"
          onClick={onClick}
          data-identifier={displayName}
        >
          Edit
        </button>
      </div>

      {!isDefault && (
        /* position="right" */
        <Tooltip text="Cannot reset code">
          <span className="property-changed-dot-noreset"></span>
        </Tooltip>
      )}
    </div>
  );
}
