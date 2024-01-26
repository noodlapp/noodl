import { useEffect, useState, useCallback } from 'react';

export interface DragHandlerOptions {
  root: React.MutableRefObject<HTMLElement>;
  minWidth: number;
  minHeight: number;

  onStartDrag?: () => void;
  onDrag?: (contentWidth: number, contentHeight: number) => void;
  onEndDrag?: () => void;
}

export function useDragHandler(options: DragHandlerOptions) {
  const [dragging, setDragging] = useState(false);
  const [dragState, setDragState] = useState({
    dragStartWidth: 0,
    dragStartHeight: 0,
    dragStartX: 0,
    dragStartY: 0
  });

  useEffect(() => {
    function drag(event: MouseEvent) {
      const deltaX = event.pageX - dragState.dragStartX;
      const deltaY = event.pageY - dragState.dragStartY;
      const newWidth = Math.max(options.minWidth, dragState.dragStartWidth + deltaX);
      const newHeight = Math.max(options.minHeight, dragState.dragStartHeight + deltaY);

      setDragState({
        dragStartX: event.pageX,
        dragStartY: event.pageY,
        dragStartWidth: newWidth,
        dragStartHeight: newHeight
      });

      options.onDrag && options.onDrag(newWidth, newHeight);

      return false;
    }

    function endDrag(_event: MouseEvent) {
      setDragging(false);

      document.removeEventListener('mousemove', drag, true);
      document.removeEventListener('mouseup', endDrag, true);

      options.onEndDrag && options.onEndDrag();

      return false;
    }

    if (dragging) {
      document.addEventListener('mousemove', drag, true);
      document.addEventListener('mouseup', endDrag, true);
    }

    return function () {
      document.removeEventListener('mousemove', drag, true);
      document.removeEventListener('mouseup', endDrag, true);
    };
  }, [dragging]);

  const startDrag = useCallback((event: { pageX: number; pageY: number }) => {
    setDragging(true);

    setDragState({
      dragStartX: event.pageX,
      dragStartY: event.pageY,
      dragStartWidth: options.root.current.offsetWidth,
      dragStartHeight: options.root.current.offsetHeight
    });

    options.onStartDrag && options.onStartDrag();

    return false;
  }, []);

  return {
    startDrag
  };
}
