import React, { useState, useEffect } from 'react';

import {
  PropertyPanelBaseInput,
  PropertyPanelBaseInputProps
} from '@noodl-core-ui/components/property-panel/PropertyPanelBaseInput';

import { extractNumber } from '../../../utils/extractNumber';

export interface PropertyPanelNumberInputProps extends Omit<PropertyPanelBaseInputProps, 'type'> {
  properties?: TSFixme;
}

export function PropertyPanelNumberInput({
  value,
  isChanged,
  isConnected,
  onChange,
  onFocus,
  onBlur,
  onKeyDown
}: PropertyPanelNumberInputProps) {
  // TODO: This component doesnt handle the value types correct

  const [displayedInputValue, setDisplayedInputValue] = useState(value?.toString() || '');

  useEffect(() => {
    handleUpdate(value?.toString() || '');
  }, [value]);

  function handleUpdate(inputValue: string) {
    // TODO: increase/decrease with arrows
    // TODO: handle drag up/down to increase/decrease
    // TODO: add basic arithmetic

    if (inputValue === '') {
      onChange && onChange(inputValue);
      return;
    }

    const newNumber = extractNumber(inputValue);

    if (!isNaN(newNumber)) {
      onChange && onChange(newNumber);
      setDisplayedInputValue(newNumber.toString());
    }
  }

  return (
    <PropertyPanelBaseInput
      value={displayedInputValue}
      type="text"
      isChanged={isChanged}
      isConnected={isConnected}
      onChange={(value) => setDisplayedInputValue(String(value))}
      onFocus={onFocus}
      onBlur={(e) => {
        handleUpdate(displayedInputValue);
        onBlur && onBlur(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleUpdate(displayedInputValue);
        }

        onKeyDown && onKeyDown(e);
      }}
    />
  );
}
