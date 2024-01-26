import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ThrottleOptions<T = any> {
  onChange?: (value: T) => void;
  leading?: boolean;
  trailing?: boolean;
}

const defaultOptions: ThrottleOptions = {
  onChange: () => {},
  leading: false,
  trailing: true
};

function useThrottle<T>(value: T, delay: number, options: ThrottleOptions<T> = {}): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());
  const handler = useRef<NodeJS.Timeout | null>(null);
  const componentMounted = useRef<boolean | null>(null);
  const leadingCall = useRef(false);
  const optionsRef = useRef<ThrottleOptions<T> | null>(null);

  options = Object.assign({}, defaultOptions, options);

  // Updating the options on every render, room for improvement
  useEffect(() => {
    optionsRef.current = options;
  });

  const clearHandler = useCallback(() => {
    if (handler.current) clearTimeout(handler.current);
    handler.current = null;
    leadingCall.current = false;
  }, []);

  useEffect(() => {
    componentMounted.current = true;
    return () => {
      // on component unmount
      componentMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (optionsRef.current?.onChange) optionsRef.current.onChange(throttledValue);
  }, [throttledValue]);

  useEffect(() => {
    if (handler.current) clearTimeout(handler.current);
    if (leadingCall.current) {
      leadingCall.current = false;
    }

    if (!handler.current && options.leading && !leadingCall.current) {
      setThrottledValue(value);
      leadingCall.current = true;
      lastExecuted.current = Date.now();
    }

    handler.current = setTimeout(() => {
      let shouldCallFunction = true;
      if (options.leading && leadingCall.current) {
        shouldCallFunction = false;
      }

      clearHandler();

      if (componentMounted.current && options.trailing && shouldCallFunction) {
        if (Date.now() - lastExecuted.current >= delay) {
          setThrottledValue(value);
          lastExecuted.current = Date.now();
        }
      }
    }, delay - (Date.now() - lastExecuted.current));

    return () => {
      if (handler.current) clearTimeout(handler.current);
    };
  }, [value, delay, clearHandler, options.leading, options.trailing]);

  return throttledValue;
}

function useThrottleState<T>(
  initialValue: T,
  delay: number,
  options: ThrottleOptions<T> = {}
): [T, React.Dispatch<React.SetStateAction<T>>, T] {
  const [value, setValue] = useState(initialValue);
  const throttledValue = useThrottle(value, delay, options);

  return [value, setValue, throttledValue];
}

export { useThrottle, useThrottleState };
