import { useEffect, useRef } from 'react';

type IntervalCallback = () => Promise<void>;

export function useInterval(callback: IntervalCallback, delay: number) {
  const savedCallback = useRef<IntervalCallback>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let cancelTimeout = false;

    async function tick() {
      try {
        await savedCallback.current();
      } catch (e) {
        console.log(e);
      }

      if (!cancelTimeout && delay !== null) {
        timeoutId = setTimeout(tick, delay);
      }
    }

    if (delay !== null) {
      tick();
    }

    return () => {
      cancelTimeout = true;
      clearTimeout(timeoutId);
    };
  }, [delay]);
}
