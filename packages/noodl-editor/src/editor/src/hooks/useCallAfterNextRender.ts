import { useCallback, useRef } from 'react';

import useOnUnmount from './useOnUnmount';

export default function useCallAfterNextRender() {
  const rafIdRef = useRef<number>(-1);

  useOnUnmount(() => {
    cancelAnimationFrame(rafIdRef.current);
  });

  const callAfterNextRender = useCallback((callback: () => void) => {
    cancelAnimationFrame(rafIdRef.current);

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = requestAnimationFrame(() => {
        callback();
      });
    });
  }, []);

  return callAfterNextRender;
}
