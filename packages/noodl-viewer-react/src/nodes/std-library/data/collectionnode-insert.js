'use strict';

const { Node } = require('@noodl/runtime');

var Model = require('@noodl/runtime/src/model'),
  Collection = require('@noodl/runtime/src/collection');

var CollectionInsertNode = {
  name: 'CollectionInsert',
  docs: 'https://docs.noodl.net/nodes/data/array/insert-into-array',
  displayNodeName: 'Insert Object Into Array',
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
    add: {
      displayName: 'Do',
      group: 'Actions',
      valueChangedToTrue: function () {
        var _this = this;
        var internal = this._internal;

        this.scheduleAfterInputsHaveUpdated(function () {
          if (this.context.editorConnection) {
            this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'insert-warning');
          }

          if (internal.modifyId === undefined) {
            if (this.context.editorConnection) {
              this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'insert-warning', {
                showGlobally: true,
                message: 'No Object Id specified'
              });
            }
            return;
          }

          if (internal.collection === undefined) {
            if (this.context.editorConnection) {
              this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'insert-warning', {
                showGlobally: true,
                message: 'No Array Id specified'
              });
            }
            return;
          }

          var model = Model.get(internal.modifyId);
          internal.collection.add(model);
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
  node: CollectionInsertNode
};
