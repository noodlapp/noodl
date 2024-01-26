'use strict';

var ModelCRUDBase = require('./modelcrudbase');

var SetModelPropertiedNodeDefinition = {
  node: {
    name: 'SetModelProperties',
    docs: 'https://docs.noodl.net/nodes/data/object/set-object-properties',
    displayNodeName: 'Set Object Properties',
    inputs: {
      store: {
        displayName: 'Do',
        group: 'Actions',
        valueChangedToTrue: function () {
          this.scheduleStore();
        }
      }
    },
    outputs: {
      stored: {
        type: 'signal',
        displayName: 'Done',
        group: 'Events'
      }
    }
  }
};

ModelCRUDBase.addBaseInfo(SetModelPropertiedNodeDefinition);
ModelCRUDBase.addModelId(SetModelPropertiedNodeDefinition);
ModelCRUDBase.addInputProperties(SetModelPropertiedNodeDefinition);

module.exports = SetModelPropertiedNodeDefinition;
