import { useRef, useEffect } from 'react';

export default function usePrevious<T = unknown>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}
