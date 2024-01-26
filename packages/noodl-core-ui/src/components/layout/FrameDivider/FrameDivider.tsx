import { SingleSlot } from '@noodl-core-ui/types/global';
import classNames from 'classnames';
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
  MouseEvent
} from 'react';
import css from './FrameDivider.module.scss';

/** DOMRect without DOMRectReadOnly */
export interface Rect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface FrameDividerRects {
  first: Rect;
  second: Rect;
}

export enum FrameDividerOwner {
  First,
  Second
}

export interface FrameDividerProps {
  horizontal?: boolean;
  reverse?: boolean;

  // TODO: Would be nice to have a way to set the split by % too

  /** The side that is the owner of the size. */
  splitOwner?: FrameDividerOwner;
  /** splitOwner size in pixels. */
  size?: number;
  /** splitOwner minimum size in pixels. */
  sizeMin?: number;
  /** splitOwner maximum size in pixels. */
  sizeMax?: number;

  first: SingleSlot;
  second: SingleSlot;

  onDrag?: (bounds: FrameDividerRects) => void;
  onDragStart?: (bounds: FrameDividerRects) => void;
  onDragEnd?: (bounds: FrameDividerRects) => void;
  onResize?: (bounds: FrameDividerRects) => void;
  onSizeChanged: (size: number) => void;
  onBoundsChanged?: (bounds: DOMRect) => void;
}

function setCssVariables(
  hash: string,
  owner: FrameDividerOwner,
  element: HTMLElement,
  value: number,
  horizontal: boolean,
  width: number,
  height: number
) {
  const halfDividerSize = 3;

  if (horizontal) {
    if (owner === FrameDividerOwner.First) {
      // Divider
      element.style.setProperty(`--frame-divider-${hash}-divider-top`, 0 + 'px');
      element.style.setProperty(
        `--frame-divider-${hash}-divider-left`,
        Math.max(Math.min(value, width), 0) - halfDividerSize + 'px'
      );

      // Container 1
      element.style.setProperty(`--frame-divider-${hash}-container-1-top`, 0 + 'px');
      element.style.setProperty(`--frame-divider-${hash}-container-1-left`, 0 + 'px');
      element.style.setProperty(
        `--frame-divider-${hash}-container-1-width`,
        Math.max(Math.min(value, width), 0) + 'px'
      );
      element.style.setProperty(`--frame-divider-${hash}-container-1-height`, height + 'px');

      // Container 2
      element.style.setProperty(`--frame-divider-${hash}-container-2-top`, 0 + 'px');
      element.style.setProperty(
        `--frame-divider-${hash}-container-2-left`,
        Math.max(value, 0) + 'px'
      );
      element.style.setProperty(
        `--frame-divider-${hash}-container-2-width`,
        Math.min(Math.max(width - value, 0), width) + 'px'
      );
      element.style.setProperty(`--frame-divider-${hash}-container-2-height`, height + 'px');
    } else {
      // Divider
      element.style.setProperty(`--frame-divider-${hash}-divider-top`, 0 + 'px');
      element.style.setProperty(
        `--frame-divider-${hash}-divider-left`,
        Math.min(Math.max(width - value, 0), width) - halfDividerSize + 'px'
      );

      // Container 1
      element.style.setProperty(`--frame-divider-${hash}-container-1-top`, 0 + 'px');
      element.style.setProperty(`--frame-divider-${hash}-container-1-left`, 0 + 'px');
      element.style.setProperty(
        `--frame-divider-${hash}-container-1-width`,
        Math.min(Math.max(width - value, 0), width) + 'px'
      );
      element.style.setProperty(`--frame-divider-${hash}-container-1-height`, height + 'px');

      // Container 2
      element.style.setProperty(`--frame-divider-${hash}-container-2-top`, 0 + 'px');
      element.style.setProperty(
        `--frame-divider-${hash}-container-2-left`,
        Math.max(width - value, 0) + 'px'
      );
      element.style.setProperty(
        `--frame-divider-${hash}-container-2-width`,
        Math.max(Math.min(value, width), 0) + 'px'
      );
      element.style.setProperty(`--frame-divider-${hash}-container-2-height`, height + 'px');
    }
  } else {
    if (owner === FrameDividerOwner.First) {
      // Divider
      element.style.setProperty(
        `--frame-divider-${hash}-divider-top`,
        Math.max(Math.min(value, height), 0) - 3 + 'px'
      );
      element.style.setProperty(`--frame-divider-${hash}-divider-left`, 0 + 'px');

      // Container 1
      element.style.setProperty(`--frame-divider-${hash}-container-1-top`, 0 + 'px');
      element.style.setProperty(`--frame-divider-${hash}-container-1-left`, 0 + 'px');
      element.style.setProperty(`--frame-divider-${hash}-container-1-width`, width + 'px');
      element.style.setProperty(
        `--frame-divider-${hash}-container-1-height`,
        Math.max(Math.min(value, height), 0) + 'px'
      );

      // Container 2
      element.style.setProperty(
        `--frame-divider-${hash}-container-2-top`,
        Math.max(value, 0) + 'px'
      );
      element.style.setProperty(`--frame-divider-${hash}-container-2-left`, 0 + 'px');
      element.style.setProperty(`--frame-divider-${hash}-container-2-width`, width + 'px');
      element.style.setProperty(
        `--frame-divider-${hash}-container-2-height`,
        Math.min(Math.max(height - value, 0), height) + 'px'
      );
    } else {
      // Divider
      element.style.setProperty(
        `--frame-divider-${hash}-divider-top`,
        Math.min(Math.max(height - value, 0), height) - 3 + 'px'
      );
      element.style.setProperty(`--frame-divider-${hash}-divider-left`, 0 + 'px');

      // Container 1
      element.style.setProperty(`--frame-divider-${hash}-container-1-top`, 0 + 'px');
      element.style.setProperty(`--frame-divider-${hash}-container-1-left`, 0 + 'px');
      element.style.setProperty(`--frame-divider-${hash}-container-1-width`, width + 'px');
      element.style.setProperty(
        `--frame-divider-${hash}-container-1-height`,
        Math.min(Math.max(height - value, 0), height) + 'px'
      );

      // Container 2
      element.style.setProperty(
        `--frame-divider-${hash}-container-2-top`,
        Math.max(height - value, 0) + 'px'
      );
      element.style.setProperty(`--frame-divider-${hash}-container-2-left`, 0 + 'px');
      element.style.setProperty(`--frame-divider-${hash}-container-2-width`, width + 'px');
      element.style.setProperty(
        `--frame-divider-${hash}-container-2-height`,
        Math.max(Math.min(value, height), 0) + 'px'
      );
    }
  }
}

function setCssDragVariables(hash: string, element: HTMLElement, start: boolean) {
  if (start) {
    element.style.setProperty(`--frame-divider-${hash}-pointer-events`, 'none');
  } else {
    element.style.setProperty(`--frame-divider-${hash}-pointer-events`, 'inherit');
  }
}

export function FrameDivider({
  horizontal = false,
  reverse = false,

  splitOwner = FrameDividerOwner.First,
  size = 343,
  sizeMin = 0,
  sizeMax,

  first,
  second,

  onDrag,
  onDragStart,
  onDragEnd,
  onResize,
  onSizeChanged,
  onBoundsChanged
}: FrameDividerProps) {
  // TODO: Create a custom hook for this? (hash)
  const [hash] = useState(() =>
    Math.floor((1 + Math.random()) * 0x100000000)
      .toString(16)
      .substring(1)
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const resizingSize = useRef<number>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const [bounds, setBounds] = useState<DOMRect | undefined>(undefined);

  const dividerStyle: React.CSSProperties = {
    top: `var(--frame-divider-${hash}-divider-top)`,
    left: `var(--frame-divider-${hash}-divider-left)`
  };

  const container1Style: React.CSSProperties = {
    top: `var(--frame-divider-${hash}-container-1-top)`,
    left: `var(--frame-divider-${hash}-container-1-left)`,
    width: `var(--frame-divider-${hash}-container-1-width)`,
    height: `var(--frame-divider-${hash}-container-1-height)`,
    // @ts-expect-error
    pointerEvents: `var(--frame-divider-${hash}-pointer-events, inherit)`
  };

  const container2Style: React.CSSProperties = {
    top: `var(--frame-divider-${hash}-container-2-top)`,
    left: `var(--frame-divider-${hash}-container-2-left)`,
    width: `var(--frame-divider-${hash}-container-2-width)`,
    height: `var(--frame-divider-${hash}-container-2-height)`,
    // @ts-expect-error
    pointerEvents: `var(--frame-divider-${hash}-pointer-events, inherit)`
  };

  /** Returns the current frame bounds. */
  const getFrameDividerRects = useCallback((): FrameDividerRects => {
    const actualSize = resizingSize.current || size;

    if (horizontal) {
      const cell1: Rect = {
        x: bounds.x,
        y: bounds.y,
        width: actualSize,
        height: bounds.height
      };
      const cell2: Rect = {
        x: bounds.x + actualSize,
        y: bounds.y,
        width: bounds.width - actualSize,
        height: bounds.height
      };

      return {
        first: splitOwner === FrameDividerOwner.First ? cell1 : cell2,
        second: splitOwner !== FrameDividerOwner.First ? cell1 : cell2
      };
    } else {
      const cell1 = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: actualSize
      };
      const cell2 = {
        x: bounds.x,
        y: bounds.y + actualSize,
        width: bounds.width,
        height: bounds.height - actualSize
      };

      return {
        first: splitOwner === FrameDividerOwner.First ? cell1 : cell2,
        second: splitOwner !== FrameDividerOwner.First ? cell1 : cell2
      };
    }
  }, [bounds, horizontal, size, splitOwner]);

  const setBoundingClientRect = useCallback(() => {
    if (rootRef.current) {
      const newBounds = rootRef.current.getBoundingClientRect();

      const hasChanged =
        bounds?.x !== newBounds.x ||
        bounds?.y !== newBounds.y ||
        bounds?.width !== newBounds.width ||
        bounds?.height !== newBounds.height;

      if (hasChanged && newBounds.width !== 0 && newBounds.height !== 0) {
        setBounds(newBounds);
        onBoundsChanged && onBoundsChanged(newBounds);
      }
    }
  }, [bounds, onBoundsChanged]);

  useLayoutEffect(() => {
    if (rootRef.current) {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      const observer = new ResizeObserver(setBoundingClientRect);
      observer.observe(rootRef.current);
      observerRef.current = observer;

      setBoundingClientRect();
    }
  }, [getFrameDividerRects, onResize, rootRef, setBoundingClientRect]);

  useEffect(() => {
    if (bounds) {
      onResize && onResize(getFrameDividerRects());
    }
  }, [bounds, getFrameDividerRects, onResize]);

  const onMouseMove = useCallback(
    function (eventObject) {
      if (horizontal) {
        const x =
          splitOwner === FrameDividerOwner.First
            ? Math.max(Math.min(eventObject.pageX - bounds.x, bounds.width), 0)
            : Math.max(Math.min(bounds.x + bounds.width - eventObject.pageX, bounds.width), 0);

        if (sizeMax) {
          resizingSize.current = Math.min(Math.max(x, sizeMin), sizeMax);
        } else {
          resizingSize.current = Math.max(x, sizeMin);
        }
      } else {
        const y =
          splitOwner === FrameDividerOwner.First
            ? Math.max(Math.min(eventObject.pageY - bounds.y, bounds.height), 0)
            : Math.max(Math.min(bounds.y + bounds.height - eventObject.pageY, bounds.height), 0);

        if (sizeMax) {
          resizingSize.current = Math.min(Math.max(y, sizeMin), sizeMax);
        } else {
          resizingSize.current = Math.max(y, sizeMin);
        }
      }

      setCssVariables(
        hash,
        splitOwner,
        rootRef.current,
        resizingSize.current,
        horizontal,
        bounds.width,
        bounds.height
      );

      // TODO: throttle onDrag ?
      onDrag && onDrag(getFrameDividerRects());
    },
    [horizontal, hash, splitOwner, bounds, onDrag, getFrameDividerRects, sizeMax, sizeMin]
  );

  const onMouseUp = useCallback(
    function () {
      onSizeChanged(resizingSize.current);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      onDragEnd && onDragEnd(getFrameDividerRects());
      setCssDragVariables(hash, rootRef.current, false);
    },
    [onMouseMove, onDragEnd, getFrameDividerRects, onSizeChanged, hash]
  );

  useEffect(() => {
    if (bounds) {
      setCssVariables(
        hash,
        splitOwner,
        rootRef.current,
        size,
        horizontal,
        bounds.width,
        bounds.height
      );
    }
  }, [hash, bounds, horizontal, size, splitOwner, onDrag]);

  function startDragging(eventObject: MouseEvent<HTMLDivElement>) {
    resizingSize.current = size;
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    onDragStart && onDragStart(getFrameDividerRects());
    setCssDragVariables(hash, rootRef.current, true);
    eventObject.stopPropagation();
  }

  useEffect(() => {
    // Check if the current size is already outside the bounds
    if (sizeMax) {
      onSizeChanged(Math.min(Math.max(size, sizeMin), sizeMax));
    } else {
      onSizeChanged(Math.max(size, sizeMin));
    }
  }, [size, sizeMax, sizeMin, onSizeChanged]);

  return (
    <div ref={rootRef} className={classNames([css['Root']])}>
      <div
        style={container1Style}
        className={classNames([
          css['Container1'],
          horizontal && css['is-horizontal'],
          !horizontal && css['is-vertical']
        ])}
      >
        {reverse ? second : first}
      </div>
      <div style={container2Style} className={classNames([css['Container2']])}>
        {reverse ? first : second}
      </div>
      <div
        style={dividerStyle}
        className={classNames([
          css['Divider'],
          horizontal && css['is-horizontal'],
          !horizontal && css['is-vertical']
        ])}
        onMouseDown={startDragging}
      >
        <div className={classNames([css['DividerBorder']])}></div>
        <div className={classNames([css['DividerHighlight']])}></div>
      </div>
    </div>
  );
}
