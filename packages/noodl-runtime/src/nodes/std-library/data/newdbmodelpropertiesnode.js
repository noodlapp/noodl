'use strict';

var Model = require('../../../model');
var DbModelCRUDBase = require('./dbmodelcrudbase');
const CloudStore = require('../../../api/cloudstore');

var NewDbModelPropertiedNodeDefinition = {
  node: {
    name: 'NewDbModelProperties',
    docs: 'https://docs.noodl.net/nodes/data/cloud-data/create-new-record',
    displayName: 'Create New Record',
    usePortAsLabel: 'collectionName',
    inputs: {
      store: {
        displayName: 'Do',
        group: 'Actions',
        valueChangedToTrue: function () {
          this.storageInsert();
        }
      },
      sourceObjectId: {
        type: { name: 'string', allowConnectionsOnly: true },
        displayName: 'Source Object Id',
        group: 'General',
        set: function (value) {
          if (value instanceof Model) value = value.getId(); // Can be passed as model as well
          this._internal.sourceObjectId = value; // Wait to fetch data
        }
      }
    },
    outputs: {
      created: {
        type: 'signal',
        displayName: 'Success',
        group: 'Events'
      }
    },
    methods: {
      storageInsert: function () {
        const internal = this._internal;

        if (!this.checkWarningsBeforeCloudOp()) return;

        this.scheduleOnce('StorageInsert', () => {
          const initValues = Object.assign(
            {},
            internal.sourceObjectId ? (this.nodeScope.modelScope || Model).get(internal.sourceObjectId).data : {},
            internal.inputValues
          );

          const cloudstore = CloudStore.forScope(this.nodeScope.modelScope);
          cloudstore.create({
            collection: internal.collectionId,
            data: initValues,
            acl: this._getACL(),
            success: (data) => {
              // Successfully created
              const m = cloudstore._fromJSON(data, internal.collectionId);
              this.setModel(m);
              this.sendSignalOnOutput('created');
            },
            error: (err) => {
              this.setError(err || 'Failed to insert.');
            }
          });
        });
      }
    }
  }
};

DbModelCRUDBase.addBaseInfo(NewDbModelPropertiedNodeDefinition);
DbModelCRUDBase.addModelId(NewDbModelPropertiedNodeDefinition, {
  includeOutputs: true
});
DbModelCRUDBase.addInputProperties(NewDbModelPropertiedNodeDefinition);
DbModelCRUDBase.addAccessControl(NewDbModelPropertiedNodeDefinition);

module.exports = NewDbModelPropertiedNodeDefinition;
