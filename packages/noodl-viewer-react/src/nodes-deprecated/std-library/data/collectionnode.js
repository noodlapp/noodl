'use strict';

const { Node } = require('@noodl/runtime');

var Model = require('@noodl/runtime/src/model'),
  Collection = require('@noodl/runtime/src/collection');

var CollectionNode = {
  name: 'Collection',
  docs: 'https://docs.noodl.net/nodes/data/array',
  displayNodeName: 'Array',
  shortDesc: 'A collection of models, mainly used together with a For Each Node.',
  category: 'Data',
  usePortAsLabel: 'collectionId',
  color: 'data',
  deprecated: true, // Use new array node
  initialize: function () {
    var _this = this;

    var collectionChangedScheduled = false;
    this._internal.collectionChangedCallback = function () {
      if (_this.isInputConnected('fetch') === true) return; // Ignore if we have explicit fetch connection

      //this can be called multiple times when adding/removing more than one item
      //so optimize by only updating outputs once
      if (collectionChangedScheduled) return;
      collectionChangedScheduled = true;

      _this.scheduleAfterInputsHaveUpdated(function () {
        _this.sendSignalOnOutput('changed');
        _this.flagOutputDirty('count');
        collectionChangedScheduled = false;
      });
    };

    // When the source collection has changed, simply copy items into this collection
    this._internal.sourceCollectionChangedCallback = function () {
      if (_this.isInputConnected('store') === true) return; // Ignore if we have explicit store connection

      _this.scheduleCopyItems();
    };
  },
  getInspectInfo() {
    if (this._internal.collection) {
      return 'Count: ' + this._internal.collection.size();
    }
  },
  inputs: {
    collectionId: {
      type: {
        name: 'string',
        identifierOf: 'CollectionName',
        identifierDisplayName: 'Array Ids'
      },
      displayName: 'Id',
      group: 'General',
      set: function (value) {
        if (value instanceof Collection) value = value.getId(); // Can be passed as collection as well
        this._internal.collectionId = value; // Wait to fetch data
        if (this.isInputConnected('fetch') === false) this.setCollectionID(value);
        else {
          this.flagOutputDirty('id');
        }
      }
    },
    items: {
      type: 'array',
      group: 'General',
      displayName: 'Items',
      set: function (value) {
        var _this = this;
        if (value === undefined) return;
        if (value === this._internal.collection) return;

        this._internal.pendingSourceCollection = value;
        if (this.isInputConnected('store') === false) {
          // Don't auto copy if we have connections to store
          this.scheduleAfterInputsHaveUpdated(function () {
            _this.setSourceCollection(value);
          });
        }
      }
    },
    modifyId: {
      type: { name: 'string', allowConnectionsOnly: true },
      displayName: 'Item Id',
      group: 'Modify',
      set: function (value) {
        this._internal.modifyId = value;
      }
    },
    /*  modifyModel: {
      type: {name:'object',
              allowConnectionsOnly:true},
      displayName:'Item',
      group:'Modify',
      set:function(value) {
        if(!(value instanceof Model)) return;
        this._internal.modifyId = value.getId();
      },
    },   */
    store: {
      displayName: 'Set',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleStore();
      }
    },
    add: {
      displayName: 'Add',
      group: 'Modify',
      valueChangedToTrue: function () {
        var _this = this;
        var internal = this._internal;

        this.scheduleAfterInputsHaveUpdated(function () {
          if (internal.modifyId === undefined) return;
          if (internal.collection === undefined && this.isInputConnected('fetch') === false)
            _this.setCollection(Collection.get()); // Create a new empty collection if we don't have one yet
          if (internal.collection === undefined) return;

          var model = Model.get(internal.modifyId);
          internal.collection.add(model);
          _this.sendSignalOnOutput('modified');
        });
      }
    },
    remove: {
      displayName: 'Remove',
      group: 'Modify',
      valueChangedToTrue: function () {
        var _this = this;
        var internal = this._internal;

        this.scheduleAfterInputsHaveUpdated(function () {
          if (internal.modifyId === undefined) return;
          if (internal.collection === undefined && this.isInputConnected('fetch') === false)
            _this.setCollection(Collection.get()); // Create a new empty collection if we don't have one yet
          if (internal.collection === undefined) return;

          var model = Model.get(internal.modifyId);
          internal.collection.remove(model);
          _this.sendSignalOnOutput('modified');
        });
      }
    },
    clear: {
      displayName: 'Clear',
      group: 'Modify',
      valueChangedToTrue: function () {
        var _this = this;
        var internal = this._internal;

        this.scheduleAfterInputsHaveUpdated(function () {
          if (internal.collection === undefined && this.isInputConnected('fetch') === false)
            _this.setCollection(Collection.get()); // Create a new empty collection if we don't have one yet
          if (internal.collection === undefined) return;

          internal.collection.set([]);
          _this.sendSignalOnOutput('modified');
          _this.sendSignalOnOutput('count');
        });
      }
    },
    fetch: {
      displayName: 'Fetch',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleSetCollection();
      }
    },
    new: {
      displayName: 'New',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleNew();
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
    items: {
      type: 'array',
      displayName: 'Items',
      group: 'General',
      getter: function () {
        return this._internal.collection;
      }
    },
    count: {
      type: 'number',
      displayName: 'Count',
      group: 'General',
      getter: function () {
        return this._internal.collection ? this._internal.collection.size() : 0;
      }
    },
    modified: {
      group: 'Events',
      type: 'signal',
      displayName: 'Modified'
    },
    changed: {
      group: 'Events',
      type: 'signal',
      displayName: 'Changed'
    },
    stored: {
      group: 'Events',
      type: 'signal',
      displayName: 'Stored'
    },
    fetched: {
      group: 'Events',
      type: 'signal',
      displayName: 'Fetched'
    },
    created: {
      group: 'Events',
      type: 'signal',
      displayName: 'Created'
    }
  },
  prototypeExtensions: {
    setCollectionID: function (id) {
      this.setCollection(Collection.get(id));
    },
    setCollection: function (collection) {
      if (this._internal.collection)
        // Remove old listener if existing
        this._internal.collection.off('change', this._internal.collectionChangedCallback);

      this._internal.collection = collection;
      this.flagOutputDirty('id');
      collection.on('change', this._internal.collectionChangedCallback);

      this.flagOutputDirty('items');
      this.flagOutputDirty('count');
    },
    setSourceCollection: function (collection) {
      var internal = this._internal;

      if (internal.sourceCollection && internal.sourceCollection instanceof Collection)
        // Remove old listener if existing
        internal.sourceCollection.off('change', internal.sourceCollectionChangedCallback);

      internal.sourceCollection = collection;
      if (internal.sourceCollection instanceof Collection)
        internal.sourceCollection.on('change', internal.sourceCollectionChangedCallback);

      this._copySourceItems();
    },
    scheduleSetCollection: function () {
      var _this = this;

      if (this.hasScheduledSetCollection) return;
      this.hasScheduledSetCollection = true;

      this.scheduleAfterInputsHaveUpdated(function () {
        _this.hasScheduledSetCollection = false;
        _this.setCollectionID(_this._internal.collectionId);
        _this.sendSignalOnOutput('fetched');
      });
    },
    scheduleStore: function () {
      var _this = this;
      if (this.hasScheduledStore) return;
      this.hasScheduledStore = true;

      var internal = this._internal;
      this.scheduleAfterInputsHaveUpdated(function () {
        _this.hasScheduledStore = false;
        _this.setSourceCollection(internal.pendingSourceCollection);
        _this.sendSignalOnOutput('stored');
      });
    },
    _copySourceItems: function () {
      var internal = this._internal;

      if (internal.collection === undefined && this.isInputConnected('fetch') === false)
        this.setCollection(Collection.get());
      internal.collection && internal.collection.set(internal.sourceCollection);
    },
    scheduleCopyItems: function () {
      var _this = this;
      var internal = this._internal;

      if (this.hasScheduledCopyItems) return;
      this.hasScheduledCopyItems = true;

      this.scheduleAfterInputsHaveUpdated(function () {
        _this.hasScheduledCopyItems = false;
        _this._copySourceItems();
      });
    },
    scheduleNew: function () {
      var _this = this;

      if (this.hasScheduledNew) return;
      this.hasScheduledNew = true;

      var internal = this._internal;
      this.scheduleAfterInputsHaveUpdated(function () {
        _this.hasScheduledNew = false;
        _this.setCollection(Collection.get());

        // If we have a source collection, copy items
        if (internal.sourceCollection) internal.collection.set(internal.sourceCollection);

        _this.sendSignalOnOutput('created');
      });
    },
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);

      if (this._internal.collection)
        // Remove old listener if existing
        this._internal.collection.off('change', this._internal.collectionChangedCallback);
    }
  }
};

module.exports = {
  node: CollectionNode
};
