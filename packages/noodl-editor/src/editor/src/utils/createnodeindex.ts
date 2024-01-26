import { NodeType } from '@noodl-constants/NodeType';
import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeLibrary, NodeLibraryNodeType } from '@noodl-models/nodelibrary';
import { RuntimeType } from '@noodl-models/nodelibrary/NodeLibraryData';
import { getComponentModelRuntimeType } from '@noodl-utils/NodeGraph';

export interface INodeIndex {
  coreNodes: INodeIndexCategory[];
  customNodes: INodeIndexCategory[];
}

export interface INodeIndexCategory {
  name: string;
  description: string;
  type: NodeType;
  subCategories?: INodeIndexSubCategory[];
  items?: TSFixme[];
}

export interface INodeIndexSubCategory {
  name: string;
  items: TSFixme[];
}

export function createNodeIndex(model: TSFixme, parentModel: TSFixme, runtimeType: RuntimeType): INodeIndex {
  function isNodeCreatable(nodeType: NodeLibraryNodeType | ComponentModel): boolean {
    // @ts-expect-error Wrong to be both NodeLibraryNodeType and ComponentModel
    if (runtimeType && nodeType.runtimeTypes && !nodeType.runtimeTypes.includes(runtimeType)) {
      return false;
    }

    // Check if node can be created with the current parent
    const status = model.owner.getCreateStatus({
      parent: parentModel,
      type: nodeType
    });

    return status.creatable;
  }

  function getNodes(names: string[]) {
    return names
      .map((name) => {
        const nodeType = NodeLibrary.instance.getNodeTypeWithName(name);

        if (!nodeType) return undefined;
        if (isNodeCreatable(nodeType)) return nodeType;
      })
      .filter(Boolean); // filter out all empty
  }

  // parse core nodes
  const coreNodes = NodeLibrary.instance.library.nodeIndex.coreNodes
    .map((category) => {
      const subCategories = category?.subCategories
        ? category.subCategories.map((subCategory) => {
            // Fetch all the subCategories items (nodes)
            return {
              name: subCategory.name,
              items: getNodes(subCategory.items)
            };
          })
        : [];

      // Fetch all the top category items (nodes)
      const items = category?.items ? getNodes(category.items) : [];

      return {
        ...category,
        subCategories,
        items
      };
    })
    .filter((category: INodeIndexCategory) => {
      let shouldKeepCategory = false;

      category.subCategories.forEach((subCategory) => {
        if (subCategory.items.length) {
          shouldKeepCategory = true;
        }
      });

      if (category.items.length) {
        shouldKeepCategory = true;
      }

      return shouldKeepCategory;
    });

  // build custom nodes
  const customNodes = [];

  const componentNodes = NodeLibrary.instance
    .getComponents()
    .filter(isNodeCreatable)
    .filter((nodeModel) => {
      const nodeModelRuntimeType = getComponentModelRuntimeType(nodeModel);
      return runtimeType === nodeModelRuntimeType;
    });

  if (componentNodes?.length) {
    customNodes.push({
      name: 'Project components',
      description: 'Custom components in the project',
      type: NodeType.None,
      subCategories: [
        {
          name: '',
          items: componentNodes
        }
      ]
    });
  }

  const moduleNodes = NodeLibrary.instance.library.nodeIndex.moduleNodes;

  if (moduleNodes?.length) {
    const subCategories = moduleNodes
      .map((subCategory) => ({
        name: subCategory.name,
        items: getNodes(subCategory.items)
      }))
      .filter((subCategory) => Boolean(subCategory.items.length));

    if (subCategories.length > 0) {
      customNodes.push({
        name: 'External libraries',
        description: 'Third party Noodl integrations',
        type: NodeType.None,
        subCategories
      });
    }
  }

  return {
    coreNodes,
    customNodes
  };
}
