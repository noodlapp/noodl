'use strict';

module.exports = {
  node: {
    name: 'Component Inputs',
    shortDesc: 'This node is used to define the inputs of a component.',
    docs: 'https://docs.noodl.net/nodes/component-utilities/component-inputs',
    panels: [
      {
        name: 'PortEditor',
        context: ['select', 'connectFrom'],
        title: 'Inputs',
        plug: 'output',
        type: {
          name: '*'
        },
        canArrangeInGroups: true
      },
      {
        name: 'PropertyEditor',
        hidden: true
      }
    ],
    getInspectInfo() {
      return { type: 'value', value: this.nodeScope.componentOwner._internal.inputValues };
    },
    color: 'component',
    haveComponentPorts: true,
    category: 'Component Utilities',
    methods: {
      registerOutputIfNeeded: function (name) {
        if (this.hasOutput(name)) {
          return;
        }

        this.registerOutput(name, {
          getter: function () {
            return this.nodeScope.componentOwner._internal.inputValues[name];
          }
        });
      },
      _updateDependencies: function () {
        this.nodeScope.componentOwner.update();
      }
    }
  }
};
