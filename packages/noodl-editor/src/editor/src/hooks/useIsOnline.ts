import { useEffect, useState } from 'react';

export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function onStatusChanged() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener('online', onStatusChanged);
    window.addEventListener('offline', onStatusChanged);

    return () => {
      window.removeEventListener('online', onStatusChanged);
      window.removeEventListener('offline', onStatusChanged);
    };
  }, []);

  return isOnline;
}
