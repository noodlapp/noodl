import React, { useEffect, useState } from 'react';

import {
  PropertyPanelBaseInput,
  PropertyPanelBaseInputProps
} from '@noodl-core-ui/components/property-panel/PropertyPanelBaseInput';

export interface PropertyPanelPasswordInputProps extends Omit<PropertyPanelBaseInputProps<string>, 'type'> {
  properties?: TSFixme;
}

export function PropertyPanelPasswordInput({
  value,
  isChanged,
  isConnected,

  onChange
}: PropertyPanelPasswordInputProps) {
  const [displayedInputValue, setDisplayedInputValue] = useState(value);
  const [focused, setFocused] = useState(false);

  function handleUpdate(inputValue: string) {
    onChange && onChange(inputValue);
    setDisplayedInputValue(inputValue);
  }

  function handleBlur() {
    handleUpdate(displayedInputValue);
    setFocused(false);
  }

  function handleFocus() {
    setFocused(true);
  }

  useEffect(() => {
    handleUpdate(value);
  }, [value]);

  return (
    <PropertyPanelBaseInput
      value={displayedInputValue}
      type={focused ? 'text' : 'password'}
      isChanged={isChanged}
      isConnected={isConnected}
      onChange={(value) => setDisplayedInputValue(String(value))}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(displayedInputValue)}
    />
  );
}
