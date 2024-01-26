'use strict';

const { Node } = require('@noodl/runtime');

var Model = require('@noodl/runtime/src/model'),
  Collection = require('@noodl/runtime/src/collection');

const defaultMapCode =
  'map({\n' +
  '\t// Here you add mappings between the input object and the mapped output object.\n' +
  "\t//myOutputProp: 'inputProp',\n" +
  "\t//anotherProperty: function(object) { return object.get('someProperty') + ' ' + object.get('otherProp') }\n" +
  '})\n';

var MapCollectionNode = {
  name: 'Map Collection',
  docs: 'https://docs.noodl.net/nodes/data/array/array-map',
  displayNodeName: 'Array Map',
  shortDesc: 'Map array fields',
  category: 'Data',
  color: 'data',
  initialize: function () {
    var _this = this;

    this._internal.collectionChangedCallback = function () {
      _this.scheduleMap();
    };

    //     this._internal.mappedCollection = Collection.get();
  },
  inputs: {
    items: {
      type: 'array',
      displayName: 'Items',
      group: 'General',
      set: function (value) {
        this.setCollection(value);
        this.scheduleMap();
      }
    },
    mapScript: {
      type: {
        name: 'string',
        allowEditOnly: true,
        codeeditor: 'javascript'
      },
      displayName: 'Script',
      default: defaultMapCode,
      set: function (value) {
        this._internal.mapCode = value;
        try {
          this._internal.mapFunc = new Function('map', 'object', this._internal.mapCode);
        } catch (e) {
          this._internal.mapFunc = undefined;
          console.log('Error while parsing map script: ' + e);
        }
        this.scheduleMap();
      }
    }
  },
  outputs: {
    items: {
      type: 'array',
      displayName: 'Items',
      group: 'General',
      getter: function () {
        return this._internal.mappedCollection;
      }
    },
    count: {
      type: 'number',
      displayName: 'Count',
      group: 'General',
      getter: function () {
        return this._internal.mappedCollection ? this._internal.mappedCollection.size() : 0;
      }
    },
    modified: {
      group: 'Events',
      type: 'signal',
      displayName: 'Changed'
    }
  },
  prototypeExtensions: {
    setCollection: function (collection) {
      this.bindCollection(collection);
      this.flagOutputDirty('items');
      this.flagOutputDirty('count');
    },
    unbindCurrentCollection: function () {
      var collection = this._internal.collection;
      if (!collection) return;
      collection.off('change', this._internal.collectionChangedCallback);
      this._internal.collection = undefined;
    },
    bindCollection: function (collection) {
      this.unbindCurrentCollection();
      this._internal.collection = collection;
      collection && collection.on('change', this._internal.collectionChangedCallback);
    },
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);
      this.unbindCurrentCollection();
    },
    scheduleMap: function () {
      if (this.collectionChangedScheduled) return;
      this.collectionChangedScheduled = true;

      this.scheduleAfterInputsHaveUpdated(() => {
        this.collectionChangedScheduled = false;
        if (this._internal.collection === undefined) return;

        var mappedModels = this._internal.collection.map((model) => {
          var m = Model.create();
          this._internal.mapFunc(function (mappings) {
            for (var key in mappings) {
              if (typeof mappings[key] === 'function') {
                m.set(key, mappings[key](model));
              } else if (typeof mappings[key] === 'string') {
                m.set(key, model.get(mappings[key]));
              }
            }
          }, model);
          return m;
        });

        this._internal.mappedCollection = Collection.create(mappedModels);

        this.sendSignalOnOutput('modified');
        this.flagOutputDirty('items');
        this.flagOutputDirty('count');
      });
    }
  }
};

module.exports = {
  node: MapCollectionNode,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }
  }
};
