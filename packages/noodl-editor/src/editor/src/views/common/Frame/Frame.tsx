import React, { useRef, useEffect, RefObject } from 'react';

import { useTrackBounds } from '@noodl-core-ui/hooks/useTrackBounds';
import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import View from '../../../../../shared/view';

/**
 * Frame Component is a temporary solution
 * to easily inject our old Views into React.
 */
export interface FrameProps extends UnsafeStyleProps {
  instance: View;

  /**
   * Allows to refresh the View instance.
   *
   * For example when the view is re-rendered,
   * and we would like to append the new element.
   * All we need to do is just change the value.
   *
   * @example
   *  function MyReactComponent() {
   *    const [renderIndex, triggerRerender] = useTriggerRerenderState();
   *
   *    // Now just call "triggerRerender" and the instance will be updated.
   *
   *    return <Frame instance={undefined} refresh={renderIndex} />
   *  }
   */
  refresh?: number;

  isAbsolute?: boolean;
  isFitWidth?: boolean;
  isContentSize?: boolean;

  onResize?: (bounds: DOMRect) => void;
  onRefChange?: (ref: RefObject<HTMLDivElement | null>) => void;
}

export function Frame({
  instance,
  refresh,
  isAbsolute,
  isFitWidth,
  isContentSize,
  onResize,
  onRefChange,
  UNSAFE_className,
  UNSAFE_style
}: FrameProps) {
  const rootRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const bounds = useTrackBounds(rootRef);

  useEffect(() => {
    onRefChange && onRefChange(rootRef);
  }, [rootRef, onRefChange]);

  useEffect(() => {
    bounds && onResize && onResize(bounds);
  }, [bounds]);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    while (rootRef.current.firstChild) {
      rootRef.current.removeChild(rootRef.current.firstChild);
    }

    if (instance && instance.el && instance.el[0]) {
      rootRef.current.appendChild(instance.el[0]);
      bounds && onResize && onResize(bounds);
    }
  }, [rootRef, instance, refresh]);

  const style: React.CSSProperties = {
    position: 'relative'
  };

  if (isAbsolute) {
    style.position = 'absolute';
  }

  if (!isContentSize) {
    style.width = '100%';
    style.height = '100%';
  }

  if (isFitWidth) {
    style.width = '100%';
  }

  return <div className={UNSAFE_className} style={{ ...style, ...UNSAFE_style }} ref={rootRef} />;
}
