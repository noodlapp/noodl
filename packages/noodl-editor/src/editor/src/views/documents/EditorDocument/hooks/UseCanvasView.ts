import { useLayoutEffect, useState } from 'react';
import { CanvasView } from '../../../VisualCanvas/CanvasView';

export function useCanvasView(setNavigationState) {
  const [canvasView, setCanvasView] = useState<CanvasView>(null);

  function createCanvasView() {
    const cv = new CanvasView({
      onNavigationStateChanged: (state) => {
        setNavigationState(state);
      }
    });
    cv.render();
    setCanvasView(cv);
    return cv;
  }

  //Create canvas view (and support hot reload)
  useLayoutEffect(() => {
    let cv = createCanvasView();

    if (import.meta.webpackHot) {
      import.meta.webpackHot.accept('../../../VisualCanvas/CanvasView', () => {
        cv.dispose();
        cv = createCanvasView();
      });
    }

    return () => {
      cv.dispose();
    };
  }, []);

  return canvasView;
}
