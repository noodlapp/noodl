import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';

import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { guid } from '@noodl-utils/utils';

import { makeImageGenerationRequest, saveImageDataToDisk } from './utils';

export async function handleImageCommand(prompt: string, statusCallback: (status: string) => void) {
  statusCallback('Generating image...');

  const imageData = await makeImageGenerationRequest(prompt);
  const imageUrl = await saveImageDataToDisk(imageData);

  const selectedNodes = NodeGraphContextTmp.nodeGraph.getSelectedNodes();
  const nodeModel = selectedNodes[0]?.model;

  //if the selected node has a "src" input, set that input directly...
  if (nodeModel && nodeModel.findPortWithName('src')) {
    nodeModel.setParameter('src', imageUrl);
  } else {
    // ...otherwise create a new node
    addNodeToGraph(
      NodeGraphNode.fromJSON({
        x: 0,
        y: 0,
        id: guid(),
        type: 'Image',
        parameters: {
          src: imageUrl
        }
      })
    );
  }
}

function addNodeToGraph(node) {
  const nodeGraphModel = NodeGraphContextTmp.nodeGraph.model;

  for (const root of nodeGraphModel.roots) {
    if (root.canAcceptChildren([node])) {
      root.addChild(node, { undo: true, label: 'create' });
    }
  }

  if (node.parent === undefined) {
    // Couldn't find compatiable root
    nodeGraphModel.addRoot(node, { undo: true, label: 'create' });
  }
}
