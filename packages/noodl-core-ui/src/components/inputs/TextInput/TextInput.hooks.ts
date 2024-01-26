import { MutableRefObject, useEffect, useState } from 'react';

import { TextInputProps } from './TextInput';

interface UseResizableInputArgs extends Pick<TextInputProps, 'value' | 'placeholder' | 'suffix'> {
  sizerRef: MutableRefObject<HTMLDivElement>;
}

export function useResizableInput({ value, placeholder, sizerRef }: UseResizableInputArgs) {
  const [sizerContent, setSizerContent] = useState<UseResizableInputArgs['value']>(null);
  const [valueWidth, setValueWidth] = useState<string>(null);

  useEffect(() => {
    if (!sizerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (!sizerRef.current) return;
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth
      // If you need a fractional value, use element.getBoundingClientRect().
      const rect = sizerRef.current.getBoundingClientRect();
      setValueWidth(`calc(${rect.width}px)`);
    });
    observer.observe(sizerRef.current);
    return function () {
      observer.disconnect();
    };
  }, [sizerRef]);

  useEffect(() => {
    if (Boolean(value)) {
      setSizerContent(value);
    } else {
      setSizerContent(placeholder);
    }
  }, [value, placeholder]);

  return { sizerContent, valueWidth };
}
