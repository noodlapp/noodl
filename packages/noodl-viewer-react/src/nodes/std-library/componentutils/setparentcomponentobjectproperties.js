'use strict';

const { Node } = require('@noodl/runtime');
const Model = require('@noodl/runtime/src/model');

const Base = require('./base');

module.exports = Base.extendSetComponentObjectProperties({
  name: 'net.noodl.SetParentComponentObjectProperties',
  displayName: 'Set Parent Component Object Properties',
  docs: 'https://docs.noodl.net/nodes/component-utilities/set-parent-component-object-properties',
  getComponentObjectId: function () {
    function getParentComponent(component) {
      let parent;
      if (component.getRoots().length > 0) {
        //visual
        const root = component.getRoots()[0];

        if (root.getVisualParentNode) {
          //regular visual node
          if (root.getVisualParentNode()) {
            parent = root.getVisualParentNode().nodeScope.componentOwner;
          }
        } else if (root.parentNodeScope) {
          //component instance node
          parent = component.parentNodeScope.componentOwner;
        }
      } else if (component.parentNodeScope) {
        parent = component.parentNodeScope.componentOwner;
      }

      //check that a parent exists and that the component is different
      if (parent && parent.nodeScope && parent.nodeScope.componentOwner !== component) {
        //check if parent has a Component State node
        if (parent.nodeScope.getNodesWithType('net.noodl.ComponentObject').length > 0) {
          return parent;
        }

        //if not, continue searching up the tree
        return getParentComponent(parent);
      }
    }

    const parent = getParentComponent(this.nodeScope.componentOwner);
    if (!parent) return;

    this._internal.parentComponentName = parent.name;

    return 'componentState' + parent.getInstanceId();
  }
});
