import { NodeGraphModel, NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { INodeIndexCategory } from '@noodl-utils/createnodeindex';
import { guid } from '@noodl-utils/utils';

import { CommentFillStyle } from '../CommentLayer/CommentLayerView';

export function parseNodeObject(nodeTypes: TSFixme[], model: TSFixme, parentModel: TSFixme) {
  const resultTree: INodeIndexCategory[] = [];

  for (const i in nodeTypes) {
    const nodeType = nodeTypes[i];

    // Check if node can be created with the current parent
    const status = model.owner.getCreateStatus({
      parent: parentModel,
      type: nodeType
    });

    if (!status.creatable) continue;

    // Add to result if allowed, build the tree if necessary
    let currentCategoryInTree = resultTree?.find((item) => item.name === nodeType.category);

    if (!currentCategoryInTree) {
      resultTree.push({
        name: nodeType.category,
        type: nodeType.color,
        description: 'TODO',
        subCategories: [],
        items: []
      });

      currentCategoryInTree = resultTree.find((item) => item.name === nodeType.category);
    }

    let currentSubCategoryInTree = currentCategoryInTree?.subCategories?.find(
      (subCategory) => subCategory.name === nodeType?.subCategory
    );

    if (typeof nodeType.subCategory !== 'undefined') {
      if (!currentSubCategoryInTree) {
        currentCategoryInTree.subCategories.push({
          name: nodeType.subCategory,
          items: []
        });

        currentSubCategoryInTree = currentCategoryInTree.subCategories?.find(
          (subCategory) => subCategory.name === nodeType?.subCategory
        );
      }

      currentSubCategoryInTree.items.push(nodeType);
    } else {
      currentCategoryInTree.items.push(nodeType);
    }
  }

  return resultTree;
}

export function createNodeFunction(
  model: NodeGraphModel,
  parentModel: NodeGraphNode,
  pos: TSFixme,
  attachToRoot: boolean
) {
  return (type: TSFixme) => {
    const node = NodeGraphNode.fromJSON({
      type: type.name,
      version: type.version,
      x: pos.x,
      y: pos.y,
      id: guid()
    });

    if (parentModel) {
      parentModel.addChild(node, { undo: true, label: 'create' });
    } else if (attachToRoot) {
      for (const root of model.roots) {
        if (root.canAcceptChildren([node])) {
          root.addChild(node, { undo: true, label: 'create' });
        }
      }

      if (node.parent === undefined)
        // Couldn't find compatiable root
        model.addRoot(node, { undo: true, label: 'create' });
    } else {
      model.addRoot(node, { undo: true, label: 'create' });
    }
  };
}

export function createNewComment(model: TSFixme, pos: TSFixme) {
  const comment = {
    text: '',
    width: 150,
    height: 100,
    fill: CommentFillStyle.Transparent,
    x: pos.x,
    y: pos.y
  };

  model.commentsModel.addComment(comment, { undo: true, label: 'add comment', focusComment: true });
}
