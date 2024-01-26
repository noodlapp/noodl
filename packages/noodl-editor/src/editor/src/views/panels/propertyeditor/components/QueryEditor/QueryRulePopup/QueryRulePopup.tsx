import React from 'react';

import type { Slot } from '@noodl-core-ui/types/global';

export interface QueryRulePopupProps {
  title: string;

  onDeleteClicked: TSFixme;

  children: Slot;
}

export function QueryRulePopup({ title, children, onDeleteClicked }: QueryRulePopupProps) {
  return (
    <div className="queryeditor-popup">
      <div className="queryeditor-header">{title}</div>
      <div className="queryeditor-content">
        <div className="queryeditor-rule">{children}</div>
        <div className="queryeditor-trash-icon" onClick={onDeleteClicked} />
      </div>
    </div>
  );
}
