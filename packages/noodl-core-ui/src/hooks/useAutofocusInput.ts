import { RefObject, useEffect, useState } from 'react';

export function useAutofocusInput() {
  const [ref, setRef] = useState<RefObject<HTMLInputElement>>(null);

  useEffect(() => {
    if (!ref?.current?.focus) return;

    ref.current.focus();
  }, [ref]);

  return setRef;
}
