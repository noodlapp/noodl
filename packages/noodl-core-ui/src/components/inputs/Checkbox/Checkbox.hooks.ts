import { Dispatch, useState } from 'react';

export function useTogglableCheckboxes<T = string | number>(): [
  selectedCheckboxes: T[],
  getIsChecked: (value: T) => boolean,
  toggleCheckbox: (value: T) => void,
  clearSelected: () => void
] {
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<T[]>([]);

  function toggleCheckbox(value: T) {
    setSelectedCheckboxes((prev) => {
      if (prev.includes(value)) {
        return [...prev].filter((arrValue) => arrValue !== value);
      } else {
        return [...prev, value];
      }
    });
  }

  function getIsChecked(value: T) {
    return selectedCheckboxes.includes(value);
  }

  function clearSelected() {
    setSelectedCheckboxes([]);
  }

  return [selectedCheckboxes, getIsChecked, toggleCheckbox, clearSelected];
}
