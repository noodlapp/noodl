import React, { useState, useEffect } from 'react';

import type { Slot } from '@noodl-core-ui/types/global';

export interface RuleInputProps {
  label: Slot;
  value: string;

  onChange: (value: string) => void;
}

export function RuleInput({ label, value, onChange }: RuleInputProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  return (
    <div className="queryeditor-component">
      <div className="queryeditor-property-inner">
        <div className="queryeditor-property-label">{label}</div>
        <input
          className="queryeditor-value-input"
          value={inputValue}
          onChange={(e) => {
            onChange(e.target.value);
            setInputValue(e.target.value);
          }}
        />
      </div>
    </div>
  );
}
