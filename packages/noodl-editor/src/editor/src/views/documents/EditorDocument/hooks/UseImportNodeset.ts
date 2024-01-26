import { NodeGraphNodeSet } from '@noodl-models/nodegraphmodel';
import { useEffect } from 'react';
import { ipcRenderer } from 'electron';

export function useImportNodeset(nodeGraph) {
  useEffect(() => {
    function onImportNodeset(event, data) {
      const json = data;

      const panAndScale = nodeGraph.getPanAndScale();

      const scaledPos = {
        x: 0 / panAndScale.scale - panAndScale.x,
        y: 0 / panAndScale.scale - panAndScale.y
      };

      const canvas = nodeGraph.canvas;
      const canvasWidth = canvas.width / (canvas.ratio * panAndScale.scale);
      const canvasHeight = canvas.height / (canvas.ratio * panAndScale.scale);

      nodeGraph.insertNodeSet({
        nodeset: NodeGraphNodeSet.fromJSON(json),
        x: scaledPos.x + canvasWidth / 2,
        y: scaledPos.y + canvasHeight / 2,
        toastMessage: 'Import'
      });
    }

    ipcRenderer.on('import-nodeset', onImportNodeset);
    return function () {
      ipcRenderer.removeListener('import-nodeset', onImportNodeset);
    };
  }, [nodeGraph]);
}
