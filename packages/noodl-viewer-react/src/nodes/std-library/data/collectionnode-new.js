'use strict';

const { Node } = require('@noodl/runtime');

var Model = require('@noodl/runtime/src/model'),
  Collection = require('@noodl/runtime/src/collection');

var CollectionNewNode = {
  name: 'CollectionNew',
  docs: 'https://docs.noodl.net/nodes/data/array/create-new-array',
  displayNodeName: 'Create New Array',
  shortDesc: 'A collection of models, mainly used together with a For Each Node.',
  category: 'Data',
  color: 'data',
  initialize: function () {},
  inputs: {
    new: {
      displayName: 'Do',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleNew();
      }
    },
    items: {
      type: 'array',
      group: 'General',
      displayName: 'Items',
      set: function (value) {
        this._internal.sourceCollection = value;
      }
    }
  },
  outputs: {
    id: {
      type: 'string',
      displayName: 'Id',
      group: 'General',
      getter: function () {
        return this._internal.collection ? this._internal.collection.getId() : this._internal.collectionId;
      }
    },
    created: {
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
      this.flagOutputDirty('id');
    },
    scheduleNew: function () {
      var _this = this;

      if (this.hasScheduledNew) return;
      this.hasScheduledNew = true;

      this.scheduleAfterInputsHaveUpdated(function () {
        _this.hasScheduledNew = false;

        const collection = Collection.get();
        if (this._internal.sourceCollection !== undefined) collection.set(this._internal.sourceCollection);

        _this.setCollection(collection);

        _this.sendSignalOnOutput('created');
      });
    }
  }
};

module.exports = {
  node: CollectionNewNode
};
