import { useState } from 'react';

export function useTogglableArray<T = string | number>(): [
  items: T[],
  toggleItem: (value: T) => void,
  isItemInArray: (value: T) => boolean,
  clearArray: () => void
] {
  const [items, setItems] = useState<T[]>([]);

  function toggleItem(item: T) {
    setItems((prev) => {
      if (prev.includes(item)) {
        return [...prev].filter((arrValue) => arrValue !== item);
      } else {
        return [...prev, item];
      }
    });
  }

  function isItemInArray(item: T) {
    return items.includes(item);
  }

  function clearArray() {
    setItems([]);
  }

  return [items, toggleItem, isItemInArray, clearArray];
}
