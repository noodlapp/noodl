'use strict';

const { Node } = require('@noodl/runtime');

var Model = require('@noodl/runtime/src/model'),
  Collection = require('@noodl/runtime/src/collection');

var CollectionRemoveNode = {
  name: 'CollectionRemove',
  docs: 'https://docs.noodl.net/nodes/data/array/remove-from-array',
  displayNodeName: 'Remove Object From Array',
  shortDesc: 'A collection of models, mainly used together with a For Each Node.',
  category: 'Data',
  usePortAsLabel: 'collectionId',
  color: 'data',
  initialize: function () {},
  inputs: {
    collectionId: {
      type: {
        name: 'string',
        identifierOf: 'CollectionName',
        identifierDisplayName: 'Array Ids'
      },
      displayName: 'Array Id',
      group: 'General',
      set: function (value) {
        if (value instanceof Collection) value = value.getId(); // Can be passed as collection as well
        this.setCollectionID(value);
      }
    },
    modifyId: {
      type: { name: 'string', allowConnectionsOnly: true },
      displayName: 'Object Id',
      group: 'Modify',
      set: function (value) {
        this._internal.modifyId = value;
      }
    },
    remove: {
      displayName: 'Do',
      group: 'Actions',
      valueChangedToTrue: function () {
        var _this = this;
        var internal = this._internal;

        this.scheduleAfterInputsHaveUpdated(function () {
          if (internal.modifyId === undefined) return;
          if (internal.collection === undefined) return;

          var model = Model.get(internal.modifyId);
          internal.collection.remove(model);
          _this.sendSignalOnOutput('modified');
        });
      }
    }
  },
  outputs: {
    modified: {
      group: 'Events',
      type: 'signal',
      displayName: 'Done'
    }
  },
  prototypeExtensions: {
    setCollectionID: function (id) {
      this.setCollection(Collection.get(id));
    },
    setCollection: function (collection) {
      this._internal.collection = collection;
    }
  }
};

module.exports = {
  node: CollectionRemoveNode
};
