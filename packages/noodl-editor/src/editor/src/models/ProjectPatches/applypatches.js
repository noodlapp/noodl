const { Patches } = require('./projectpatchgenerators');

function _applyPatch(node, p) {
  if (p.typename) node.typename = p.typename;
  if (p.version) node.version = p.version;
  for (var name in p.params) {
    var value = p.params[name];
    if (value === null) node.parameters[name] = undefined;
    else node.parameters[name] = value;
  }
  if (p.portsToDelete) {
    for (const name of p.portsToDelete) {
      var idx = node.ports.findIndex((p) => p.name === name);
      if (idx !== -1) {
        node.ports.splice(idx, 1);
      }
    }
  }
}

function _applyPatches(node, patchSets) {
  for (const patchSet of patchSets) {
    for (const patch of patchSet.patches) {
      if (patch.condition(node)) {
        const patchData = patch.generatePatch(node);
        _applyPatch(node, patchData);
      }
    }
  }
}

function _applyPatchesRecursive(node, patchSets) {
  _applyPatches(node, patchSets);
  node.children &&
    node.children.forEach((child) => {
      _applyPatchesRecursive(child, patchSets);
    });
}

module.exports = {
  applyPatches: function (projectJSON, patchSets = Patches) {
    //iterate through all nodes
    projectJSON.components.forEach((component) => {
      component.graph &&
        component.graph.roots &&
        component.graph.roots.forEach((node) => {
          _applyPatchesRecursive(node, patchSets);
        });
    });
  }
};
