import { ProjectModel } from '@noodl-models/projectmodel';
import { useEffect } from 'react';
import { CanvasView } from '../../../VisualCanvas/CanvasView';
import { ipcRenderer } from 'electron';

export function useCaptureThumbnails(canvasView: CanvasView, viewerDetached: boolean) {
  useEffect(() => {
    // Start capture interval for viewer thumbs
    const timer = setInterval(async () => {
      if (viewerDetached) {
        ipcRenderer.send('viewer-capture-thumb');
        ipcRenderer.once('viewer-capture-thumb-reply', (event, url) => {
          ProjectModel.instance.setThumbnailFromDataURI(url);
        });
      } else {
        const thumb = await canvasView?.captureThumbnail();
        if (thumb) {
          ProjectModel.instance.setThumbnailFromDataURI(thumb.toDataURL());
        }
      }
    }, 20 * 1000); // Every 20 secs

    return () => {
      clearInterval(timer);
    };
  }, [canvasView, viewerDetached]);
}
