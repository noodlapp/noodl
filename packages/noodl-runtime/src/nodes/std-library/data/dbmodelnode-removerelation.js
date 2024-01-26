'use strict';

var Model = require('../../../model');
var DbModelCRUDBase = require('./dbmodelcrudbase');
const CloudStore = require('../../../api/cloudstore');

var AddDbModelRelationNodeDefinition = {
  node: {
    name: 'RemoveDbModelRelation',
    docs: 'https://docs.noodl.net/nodes/data/cloud-data/remove-record-relation',
    displayName: 'Remove Record Relation',
    usePortAsLabel: 'collectionName',
    inputs: {
      store: {
        displayName: 'Do',
        group: 'Actions',
        valueChangedToTrue: function () {
          this.scheduleRemoveRelation();
        }
      }
    },
    outputs: {
      relationRemoved: {
        type: 'signal',
        displayName: 'Success',
        group: 'Events'
      }
    },
    methods: {
      validateInputs: function () {
        if (!this.context.editorConnection) return;

        const _warning = (message) => {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'add-relation', {
            message
          });
        };

        if (this._internal.collectionId === undefined) {
          _warning('No class specified');
        } else if (this._internal.relationProperty === undefined) {
          _warning('No relation property specified');
        } else if (this._internal.targetModelId === undefined) {
          _warning('No target record Id (the record to add a relation to) specified');
        } else if (this._internal.model === undefined) {
          _warning('No record Id specified (the record that should get the relation)');
        } else {
          this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'add-relation');
        }
      },
      scheduleRemoveRelation: function (key) {
        const _this = this;
        const internal = this._internal;

        this.scheduleOnce('StorageRemoveRelation', function () {
          _this.validateInputs();

          if (!internal.model) return;
          var model = internal.model;

          var targetModelId = internal.targetModelId;
          if (targetModelId === undefined) return;

          CloudStore.forScope(_this.nodeScope.modelScope).removeRelation({
            collection: internal.collectionId,
            objectId: model.getId(),
            key: internal.relationProperty,
            targetObjectId: targetModelId,
            targetClass: (_this.nodeScope.modelScope || Model).get(targetModelId)._class,
            success: function (response) {
              for (var _key in response) {
                model.set(_key, response[_key]);
              }

              // Successfully removed relation
              _this.sendSignalOnOutput('relationRemoved');
            },
            error: function (err) {
              _this.setError(err || 'Failed to remove relation.');
            }
          });
        });
      }
    }
  }
};

DbModelCRUDBase.addBaseInfo(AddDbModelRelationNodeDefinition, {
  includeRelations: true
});
DbModelCRUDBase.addModelId(AddDbModelRelationNodeDefinition);
DbModelCRUDBase.addRelationProperty(AddDbModelRelationNodeDefinition);

module.exports = AddDbModelRelationNodeDefinition;
