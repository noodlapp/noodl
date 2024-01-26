import React, { useEffect, useState } from 'react';

import {
  PropertyPanelBaseInput,
  PropertyPanelBaseInputProps
} from '@noodl-core-ui/components/property-panel/PropertyPanelBaseInput';

export interface PropertyPanelTextInputProps extends Omit<PropertyPanelBaseInputProps<string>, 'type'> {
  properties?: TSFixme;
}

export function PropertyPanelTextInput({
  value,
  isChanged,
  isConnected,

  onChange
}: PropertyPanelTextInputProps) {
  const [displayedInputValue, setDisplayedInputValue] = useState(value);

  function handleUpdate(inputValue: string) {
    onChange && onChange(inputValue);
    setDisplayedInputValue(inputValue);
  }

  useEffect(() => {
    handleUpdate(value);
  }, [value]);

  return (
    <PropertyPanelBaseInput
      value={displayedInputValue}
      type="text"
      isChanged={isChanged}
      isConnected={isConnected}
      onChange={(value) => setDisplayedInputValue(String(value))}
      onBlur={(e) => handleUpdate(displayedInputValue)}
      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(displayedInputValue)}
    />
  );
}
