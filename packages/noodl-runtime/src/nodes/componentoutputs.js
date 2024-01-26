'use strict';

module.exports = {
  node: {
    category: 'Component Utilities',
    name: 'Component Outputs',
    shortDesc: 'This node is used to define the outputs of a component.',
    docs: 'https://docs.noodl.net/nodes/component-utilities/component-outputs',
    panels: [
      {
        name: 'PortEditor',
        context: ['select', 'connectTo'],
        title: 'Outputs',
        plug: 'input',
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
    color: 'component',
    haveComponentPorts: true,
    prototypeExtensions: {
      registerInputIfNeeded: function (name) {
        if (this.hasInput(name)) {
          return;
        }

        this.registerInput(name, {
          set: function (value) {
            this.nodeScope.componentOwner.setOutputFromComponentOutput(name, value);
          }
        });
      }
    }
  }
};
