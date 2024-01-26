import React, { useLayoutEffect, useState } from "react";

/**
 * Track the Bounding Client Rect on a HTMLElement.
 *
 * @param ref The HTML Element we are tracking.
 * @returns ref.current.getBoundingClientRect() result.
 */
export function useTrackBounds(ref: React.MutableRefObject<HTMLElement>) {
  const [bounds, setBounds] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => {
      const newBounds = ref.current?.getBoundingClientRect();
      setBounds(newBounds);
    });
    observer.observe(ref.current);

    setBounds(ref.current?.getBoundingClientRect());

    return function () {
      observer.disconnect();
    };
  }, [ref]);

  return bounds;
}
