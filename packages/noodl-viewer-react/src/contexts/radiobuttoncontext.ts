import React from 'react';

export interface IRadioButtonContext {
  name: string;
  selected: string;
  checkedChanged?: (value: string) => void;
}

const RadioButtonContext = React.createContext<IRadioButtonContext>({
  name: undefined,
  selected: undefined,
  checkedChanged: undefined
});

export default RadioButtonContext;
