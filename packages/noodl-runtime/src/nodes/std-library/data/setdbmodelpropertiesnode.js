'use strict';

var DbModelCRUDBase = require('./dbmodelcrudbase');
const CloudStore = require('../../../api/cloudstore');

var SetDbModelPropertiedNodeDefinition = {
  node: {
    name: 'SetDbModelProperties',
    docs: 'https://docs.noodl.net/nodes/data/cloud-data/set-record-properties',
    displayNodeName: 'Set Record Properties',
    usePortAsLabel: 'collectionName',
    dynamicports: [
      {
        name: 'conditionalports/extended',
        condition: 'storeType = cloud OR storeType NOT SET',
        inputs: ['storeProperties']
      }
    ],
    inputs: {
      store: {
        displayName: 'Do',
        group: 'Actions',
        valueChangedToTrue: function () {
          if (this._internal.storeType === undefined || this._internal.storeType === 'cloud') this.scheduleSave();
          else this.scheduleStore();
        }
      },
      storeProperties: {
        displayName: 'Properties to  store',
        group: 'General',
        type: {
          name: 'enum',
          enums: [
            { label: 'Only specified', value: 'specified' },
            { label: 'All', value: 'all' }
          ]
        },
        default: 'specified',
        set: function (value) {
          this._internal.storeProperties = value;
        }
      },
      storeType: {
        displayName: 'Store to',
        group: 'General',
        type: {
          name: 'enum',
          enums: [
            { label: 'Cloud and local', value: 'cloud' },
            { label: 'Local only', value: 'local' }
          ]
        },
        default: 'cloud',
        set: function (value) {
          this._internal.storeType = value;
        }
      }
    },
    outputs: {
      stored: {
        type: 'signal',
        displayName: 'Success',
        group: 'Events'
      }
    },
    methods: {
      scheduleSave: function () {
        const _this = this;
        const internal = this._internal;

        if (!this.checkWarningsBeforeCloudOp()) return;

        this.scheduleOnce('StorageSave', function () {
          if (!internal.model) {
            _this.setError('Missing Record Id');
            return;
          }
          
          const model = internal.model;
          for (const key in internal.inputValues) {
            model.set(key, internal.inputValues[key], { resolve: true });
          }
          
          CloudStore.forScope(_this.nodeScope.modelScope).save({
            collection: internal.collectionId,
            objectId: model.getId(), // Get the objectId part of the model id
            data: internal.storeProperties === 'all' ? model.data : internal.inputValues, // Only store input values by default, if not explicitly specified
            acl: _this._getACL(),
            success: function (response) {
              for (var key in response) {
                model.set(key, response[key]);
              }

              _this.sendSignalOnOutput('stored');
            },
            error: function (err) {
              _this.setError(err || 'Failed to save.');
            }
          });
        });
      },
      scheduleStore: function () {
        if (this.hasScheduledStore) return;
        this.hasScheduledStore = true;

        var internal = this._internal;
        this.scheduleAfterInputsHaveUpdated(() => {
          this.hasScheduledStore = false;
          if (!internal.model) return;

          for (var i in internal.inputValues) {
            internal.model.set(i, internal.inputValues[i], { resolve: true });
          }
          this.sendSignalOnOutput('stored');
        });
      }
    }
  }
};

DbModelCRUDBase.addBaseInfo(SetDbModelPropertiedNodeDefinition);
DbModelCRUDBase.addModelId(SetDbModelPropertiedNodeDefinition);
DbModelCRUDBase.addInputProperties(SetDbModelPropertiedNodeDefinition);
DbModelCRUDBase.addAccessControl(SetDbModelPropertiedNodeDefinition);

module.exports = SetDbModelPropertiedNodeDefinition;
