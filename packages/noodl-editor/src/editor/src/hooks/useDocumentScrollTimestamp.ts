import { useEffect, useState } from 'react';

export default function useDocumentScrollTimestamp(isEnabled = true, debounceMs = 0) {
  const [timestamp, setTimestamp] = useState(Date.now());

  useEffect(() => {
    let debounceTimeoutId: ReturnType<typeof setTimeout>;

    function onResize() {
      clearTimeout(debounceTimeoutId);
      debounceTimeoutId = setTimeout(() => setTimestamp(Date.now()), debounceMs);
    }

    function cleanup() {
      document.removeEventListener('scroll', onResize, true);
      clearTimeout(debounceTimeoutId);
    }

    if (isEnabled) {
      document.addEventListener('scroll', onResize, true);
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [isEnabled, debounceMs]);

  return timestamp;
}
