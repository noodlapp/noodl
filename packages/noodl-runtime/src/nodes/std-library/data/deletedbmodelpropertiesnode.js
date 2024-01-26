'use strict';

var DbModelCRUDBase = require('./dbmodelcrudbase');
const CloudStore = require('../../../api/cloudstore');

var DeleteDbModelPropertiedNodeDefinition = {
  node: {
    name: 'DeleteDbModelProperties',
    docs: 'https://docs.noodl.net/nodes/data/cloud-data/delete-record',
    displayNodeName: 'Delete Record',
    shortDesc:
      'Stores any amount of properties and can be used standalone or together with Collections and For Each nodes.',
    inputs: {
      store: {
        displayName: 'Do',
        group: 'Actions',
        valueChangedToTrue: function () {
          this.storageDelete();
        }
      }
    },
    outputs: {
      deleted: {
        type: 'signal',
        displayName: 'Success',
        group: 'Events'
      }
    },
    methods: {
      storageDelete: function () {
        const _this = this;
        const internal = this._internal;

        if (!this.checkWarningsBeforeCloudOp()) return;

        this.scheduleOnce('StorageDelete', function () {
          if (!internal.model) {
            _this.setError('Missing Record Id');
            return;
          }

          CloudStore.forScope(_this.nodeScope.ModelScope).delete({
            collection: internal.collectionId,
            objectId: internal.model.getId(), // Get the objectId part of the model id,
            success: function () {
              internal.model.notify('delete'); // Notify that this model has been deleted
              _this.sendSignalOnOutput('deleted');
            },
            error: function (err) {
              _this.setError(err || 'Failed to delete.');
            }
          });
        });
      }
    }
  }
};

DbModelCRUDBase.addBaseInfo(DeleteDbModelPropertiedNodeDefinition, {
  includeInputProperties: false
});
DbModelCRUDBase.addModelId(DeleteDbModelPropertiedNodeDefinition);

module.exports = DeleteDbModelPropertiedNodeDefinition;
