import React from 'react';

export interface RuleValueOrInputLabelProps {
  isValue: boolean;
  onClick: () => void;
}

export function RuleValueOrInputLabel({ onClick, isValue }: RuleValueOrInputLabelProps) {
  return (
    <div
      onClick={(e) => {
        onClick();
        e.stopPropagation();
      }}
    >
      <span className={isValue ? 'queryeditor-strong' : ''}>VALUE</span>
      {' | '}
      <span className={!isValue ? 'queryeditor-strong' : ''}>INPUT</span>
    </div>
  );
}
