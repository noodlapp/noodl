import React, { useState, useEffect, useCallback, useRef } from 'react';

export function TestView({ backgroundColor }) {
  const rootRef = useRef(null);
  const observerRef = useRef(null);
  const [bounds, setBounds] = useState(undefined);

  const onResize = useCallback(() => {
    if (rootRef.current) {
      setBounds(rootRef.current.getBoundingClientRect());
    }
  }, [rootRef]);

  useEffect(() => {
    if (rootRef.current) {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      const observer = new ResizeObserver(onResize);
      observer.observe(rootRef.current);
      observerRef.current = observer;
    }
  }, [rootRef, onResize]);

  return (
    <div
      ref={rootRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '20px',
        userSelect: 'none'
      }}
    >
      {Boolean(bounds) && (
        <span>
          {bounds.width}x{bounds.height}
        </span>
      )}
    </div>
  );
}
