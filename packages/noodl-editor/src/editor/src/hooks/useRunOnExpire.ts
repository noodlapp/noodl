import useTimeout from '@noodl-hooks/useTimeout';
import { useState } from 'react';

export function useRunOnExpire(onExpire: () => void, ms: number) {
  const [isTimeoutRunning, setIsTimeoutRunning] = useState(false);
  useTimeout(onExpire, isTimeoutRunning ? ms : null);

  function startExpiration() {
    setIsTimeoutRunning(true);
  }

  function cancelExpiration() {
    setIsTimeoutRunning(false);
  }

  return [startExpiration, cancelExpiration];
}
