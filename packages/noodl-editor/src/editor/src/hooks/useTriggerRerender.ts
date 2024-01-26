import { useState } from 'react';

export function useTriggerRerender() {
  const [_, setTimestamp] = useState(0);

  function triggerRender() {
    const timestamp = Date.now();
    setTimestamp(timestamp);
  }

  return triggerRender;
}

export function useTriggerRerenderState(): [number, () => void] {
  const [time, setTimestamp] = useState(0);

  function triggerRender() {
    const timestamp = Date.now();
    setTimestamp(timestamp);
  }

  return [time, triggerRender];
}
