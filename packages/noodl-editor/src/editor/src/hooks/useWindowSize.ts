import { useState, useEffect } from 'react';

function getWindowSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

export default function useWindowSize(debounceMs = 250) {
  const [size, setSize] = useState(getWindowSize());

  useEffect(() => {
    let debounceTimeoutId: ReturnType<typeof setTimeout>;

    function onResize() {
      clearTimeout(debounceTimeoutId);
      debounceTimeoutId = setTimeout(() => setSize(getWindowSize()), debounceMs);
    }

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(debounceTimeoutId);
    };
  }, [debounceMs]);

  return size;
}
