'use strict';

var Model = require('../../../model');
var ModelCRUDBase = require('./modelcrudbase');

var NewModelNodeDefinition = {
  node: {
    name: 'NewModel',
    docs: 'https://docs.noodl.net/nodes/data/object/create-new-object',
    displayNodeName: 'Create New Object',
    inputs: {
      new: {
        displayName: 'Do',
        group: 'Actions',
        valueChangedToTrue: function () {
          this.scheduleNew();
        }
      }
    },
    outputs: {
      created: {
        type: 'signal',
        displayName: 'Done',
        group: 'Events'
      }
    },
    methods: {
      scheduleNew: function () {
        if (this.hasScheduledNew) return;
        this.hasScheduledNew = true;

        this.scheduleAfterInputsHaveUpdated(() => {
          this.hasScheduledNew = false;
          const newModel = (this.nodeScope.modelScope || Model).get();

          this._pushInputValues(newModel);

          this.setModel(newModel);

          this.sendSignalOnOutput('created');
        });
      }
    }
  }
};

ModelCRUDBase.addBaseInfo(NewModelNodeDefinition);
ModelCRUDBase.addModelId(NewModelNodeDefinition, { includeOutputs: true });
ModelCRUDBase.addInputProperties(NewModelNodeDefinition);

module.exports = NewModelNodeDefinition;
