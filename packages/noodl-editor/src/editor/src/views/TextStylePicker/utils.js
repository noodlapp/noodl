const { ProjectModel } = require('../../models/projectmodel');

function isStyleUsedByNodeOrVariant(nodeOrVariant, portType, styleName) {
  const stylePortNames = nodeOrVariant
    .getPorts('input')
    .filter((p) => (p.type.name || p.type) === portType)
    .map((p) => p.name);

  return stylePortNames.some((portName) => {
    if (nodeOrVariant.parameters[portName] === styleName) return true;

    if (nodeOrVariant.stateParameters) {
      for (const state of Object.keys(nodeOrVariant.stateParameters)) {
        if (nodeOrVariant.stateParameters[state][portName] === styleName) return true;
      }
    }

    return false;
  });
}

function getStyleUsage(portType, styleName) {
  //check if any nodes are using the style
  //look in parameters, variants, and all visual states
  const components = ProjectModel.instance.getComponents();

  let nodeCount = 0;
  components.forEach((c) => {
    c.graph.forEachNode((node) => {
      if (isStyleUsedByNodeOrVariant(node, portType, styleName)) {
        nodeCount++;
      }
    });
  });

  const variants = ProjectModel.instance.getAllVariants();
  const variantCount = variants.filter((variant) => isStyleUsedByNodeOrVariant(variant, portType, styleName)).length;

  return { nodeCount, variantCount };
}

module.exports = {
  getStyleUsage
};
