'use strict';

const { Node, EdgeTriggeredInput } = require('@noodl/runtime');

const Model = require('@noodl/runtime/src/model'),
  Collection = require('@noodl/runtime/src/collection'),
  CloudStore = require('@noodl/runtime/src/api/cloudstore'),
  JavascriptNodeParser = require('@noodl/runtime/src/javascriptnodeparser');

function _convertFilterOp(filter, options) {
  const keys = Object.keys(filter);
  if (keys.length === 0) return {};
  if (keys.length !== 1) return options.error('Filter must only have one key found ' + keys.join(','));

  const res = {};
  const key = keys[0];
  if (filter['and'] !== undefined && Array.isArray(filter['and'])) {
    res['$and'] = filter['and'].map((f) => _convertFilterOp(f, options));
  } else if (filter['or'] !== undefined && Array.isArray(filter['or'])) {
    res['$or'] = filter['or'].map((f) => _convertFilterOp(f, options));
  } else if (filter['idEqualTo'] !== undefined) {
    res['objectId'] = { $eq: filter['idEqualTo'] };
  } else if (filter['idContainedIn'] !== undefined) {
    res['objectId'] = { $in: filter['idContainedIn'] };
  } else if (filter['relatedTo'] !== undefined) {
    var modelId = filter['relatedTo']['id'];
    if (modelId === undefined) return options.error('Must provide id in relatedTo filter');

    var relationKey = filter['relatedTo']['key'];
    if (relationKey === undefined) return options.error('Must provide key in relatedTo filter');

    var m = Model.get(modelId);
    res['$relatedTo'] = {
      object: {
        __type: 'Pointer',
        objectId: modelId,
        className: m._class
      },
      key: relationKey
    };
  } else if (typeof filter[key] === 'object') {
    const opAndValue = filter[key];
    if (opAndValue['equalTo'] !== undefined) res[key] = { $eq: opAndValue['equalTo'] };
    else if (opAndValue['notEqualTo'] !== undefined) res[key] = { $ne: opAndValue['notEqualTo'] };
    else if (opAndValue['lessThan'] !== undefined) res[key] = { $lt: opAndValue['lessThan'] };
    else if (opAndValue['greaterThan'] !== undefined) res[key] = { $gt: opAndValue['greaterThan'] };
    else if (opAndValue['lessThanOrEqualTo'] !== undefined) res[key] = { $lte: opAndValue['lessThanOrEqualTo'] };
    else if (opAndValue['greaterThanOrEqualTo'] !== undefined) res[key] = { $gte: opAndValue['greaterThanOrEqualTo'] };
    else if (opAndValue['exists'] !== undefined) res[key] = { $exists: opAndValue['exists'] };
    else if (opAndValue['containedIn'] !== undefined) res[key] = { $in: opAndValue['containedIn'] };
    else if (opAndValue['notContainedIn'] !== undefined) res[key] = { $nin: opAndValue['notContainedIn'] };
    else if (opAndValue['pointsTo'] !== undefined) {
      var m = Model.get(opAndValue['pointsTo']);
      if (CloudStore._collections[options.collectionName])
        var schema = CloudStore._collections[options.collectionName].schema;

      var targetClass =
        schema && schema.properties && schema.properties[key] ? schema.properties[key].targetClass : undefined;
      var type = schema && schema.properties && schema.properties[key] ? schema.properties[key].type : undefined;

      if (type === 'Relation') {
        res[key] = {
          __type: 'Pointer',
          objectId: opAndValue['pointsTo'],
          className: targetClass
        };
      } else {
        if (Array.isArray(opAndValue['pointsTo']))
          res[key] = {
            $in: opAndValue['pointsTo'].map((v) => {
              return { __type: 'Pointer', objectId: v, className: targetClass };
            })
          };
        else
          res[key] = {
            $eq: {
              __type: 'Pointer',
              objectId: opAndValue['pointsTo'],
              className: targetClass
            }
          };
      }
    } else if (opAndValue['matchesRegex'] !== undefined) {
      res[key] = {
        $regex: opAndValue['matchesRegex'],
        $options: opAndValue['options']
      };
    } else if (opAndValue['text'] !== undefined && opAndValue['text']['search'] !== undefined) {
      var _v = opAndValue['text']['search'];
      if (typeof _v === 'string') res[key] = { $text: { $search: { $term: _v, $caseSensitive: false } } };
      else
        res[key] = {
          $text: {
            $search: {
              $term: _v.term,
              $language: _v.language,
              $caseSensitive: _v.caseSensitive,
              $diacriticSensitive: _v.diacriticSensitive
            }
          }
        };
    }
  } else {
    options.error('Unrecognized filter keys ' + keys.join(','));
  }

  return res;
}

var DbCollectionNode = {
  name: 'DbCollection',
  docs: 'https://docs.noodl.net/nodes/cloud-services/collection',
  displayNodeName: 'Query Collection',
  shortDesc: 'A database collection.',
  category: 'Cloud Services',
  usePortAsLabel: 'collectionName',
  color: 'data',
  deprecated: true, // Use Query Records
  initialize: function () {
    var _this = this;

    var collectionChangedScheduled = false;
    this._internal.collectionChangedCallback = function () {
      //this can be called multiple times when adding/removing more than one item
      //so optimize by only updating outputs once
      if (collectionChangedScheduled) return;
      collectionChangedScheduled = true;

      _this.scheduleAfterInputsHaveUpdated(function () {
        _this.sendSignalOnOutput('modified');
        _this.flagOutputDirty('count');
        _this.flagOutputDirty('firstItemId');
        //  _this.flagOutputDirty('firstItem');
        collectionChangedScheduled = false;
      });
    };

    this._internal.storageSettings = {};
  },
  inputs: {},
  outputs: {
    id: {
      type: 'string',
      displayName: 'Name',
      group: 'General',
      getter: function () {
        return this._internal.name;
      }
    },
    items: {
      type: 'array',
      displayName: 'Result',
      group: 'General',
      getter: function () {
        return this._internal.collection;
      }
    },
    firstItemId: {
      type: 'string',
      displayName: 'First Item Id',
      group: 'General',
      getter: function () {
        if (this._internal.collection) {
          var firstItem = this._internal.collection.get(0);
          if (firstItem !== undefined) return firstItem.getId();
        }
      }
    },
    /*    firstItem: {
            type: 'object',
            displayName: 'First Item',
            group: 'General',
            getter: function () {
                if (this._internal.collection) {
                    return this._internal.collection.get(0);
                }
            }
        },  */
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
    fetched: {
      group: 'Events',
      type: 'signal',
      displayName: 'Fetched'
    },
    failure: {
      group: 'Events',
      type: 'signal',
      displayName: 'Failure'
    },
    error: {
      type: 'string',
      displayName: 'Error',
      group: 'Events',
      getter: function () {
        return this._internal.error;
      }
    }
  },
  prototypeExtensions: {
    setCollectionName: function (name) {
      this._internal.name = name;
      // this.invalidateCollection();
      this.flagOutputDirty('id');
    },
    setCollection: function (collection) {
      this.bindCollection(collection);
      this.flagOutputDirty('firstItemId');
      // this.flagOutputDirty('firstItem');
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
    setError: function (err) {
      this._internal.err = err;
      this.flagOutputDirty('error');
      this.sendSignalOnOutput('failure');
    },
    fetch: function () {
      var internal = this._internal;

      if (this.context.editorConnection) {
        if (this._internal.name === undefined) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'query-collection', {
            message: 'No collection specified for query'
          });
        } else {
          this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'query-collection');
        }
      }

      if (internal.fetchScheduled) return;
      internal.fetchScheduled = true;
      this.scheduleAfterInputsHaveUpdated(() => {
        internal.fetchScheduled = false;

        const _c = Collection.get();
        const f = this.getStorageFilter();
        CloudStore.instance.query({
          collection: this._internal.name,
          where: f.where,
          sort: f.sort,
          limit: this.getStorageLimit(),
          skip: this.getStorageSkip(),
          success: (results) => {
            if (results !== undefined) {
              _c.set(
                results.map((i) => {
                  var m = CloudStore._fromJSON(i, this._internal.name);

                  // Remove from collection if model is deleted
                  m.on('delete', () => _c.remove(m));
                  return m;
                })
              );
            }
            this.setCollection(_c);
            this.sendSignalOnOutput('fetched');
          },
          error: (err) => {
            this.setCollection(_c);
            this.setError(err || 'Failed to fetch.');
          }
        });
      });
    },
    getStorageFilter: function () {
      const storageSettings = this._internal.storageSettings;
      if (storageSettings['storageFilterType'] === undefined || storageSettings['storageFilterType'] === 'simple') {
        // Create simple filter
        if (storageSettings['storageFilter']) {
          const filters = storageSettings['storageFilter'].split(',');
          var _filters = [];
          filters.forEach(function (f) {
            const _filter = {};
            var op = '$' + (storageSettings['storageFilterOp-' + f] || 'eq');
            _filter[f] = {};
            _filter[f][op] = storageSettings['storageFilterValue-' + f];
            _filters.push(_filter);
          });
          var _where = _filters.length > 1 ? { $and: _filters } : _filters[0];
        }

        if (storageSettings['storageSort']) {
          const sort = storageSettings['storageSort'].split(',');
          var _sort = [];
          sort.forEach(function (s) {
            _sort.push((storageSettings['storageSort-' + s] === 'descending' ? '-' : '') + s);
          });
        }

        return {
          where: _where,
          sort: _sort
        };
      } else if (storageSettings['storageFilterType'] === 'json') {
        // JSON filter
        if (!this._internal.filterFunc) {
          try {
            var filterCode = storageSettings['storageJSONFilter'];

            // Parse out variables
            filterCode = filterCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove comments
            this._internal.filterVariables = filterCode.match(/\$[A-Za-z0-9]+/g) || [];

            var args = ['filter', 'where', 'sort', 'Inputs']
              .concat(this._internal.filterVariables)
              .concat([filterCode]);
            this._internal.filterFunc = Function.apply(null, args);
          } catch (e) {
            this._internal.filterFunc = undefined;
            console.log('Error while parsing filter script: ' + e);
          }
        }

        if (!this._internal.filterFunc) return;

        var _filter = {},
          _sort = [],
          _this = this;

        // Collect filter variables
        var _filterCb = function (f) {
          _filter = _convertFilterOp(f, {
            collectionName: _this._internal.name,
            error: function (err) {
              _this.context.editorConnection.sendWarning(
                _this.nodeScope.componentOwner.name,
                _this.id,
                'query-collection-filter',
                {
                  message: err
                }
              );
            }
          });
        };
        var _sortCb = function (s) {
          _sort = s;
        };

        // Extract inputs
        const inputs = {};
        for (let key in storageSettings) {
          if (key.startsWith('storageFilterValue-'))
            inputs[key.substring('storageFilterValue-'.length)] = storageSettings[key];
        }

        var filterFuncArgs = [_filterCb, _filterCb, _sortCb, inputs]; // One for filter, one for where

        this._internal.filterVariables.forEach((v) => {
          filterFuncArgs.push(storageSettings['storageFilterValue-' + v.substring(1)]);
        });

        // Run the code to get the filter
        try {
          this._internal.filterFunc.apply(this, filterFuncArgs);
        } catch (e) {
          console.log('Error while running filter script: ' + e);
        }

        return { where: _filter, sort: _sort };
      }
    },
    getStorageLimit: function () {
      const storageSettings = this._internal.storageSettings;

      if (!storageSettings['storageEnableLimit']) return;
      else return storageSettings['storageLimit'] || 10;
    },
    getStorageSkip: function () {
      const storageSettings = this._internal.storageSettings;

      if (!storageSettings['storageEnableLimit']) return;
      else return storageSettings['storageSkip'] || 0;
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      this.registerOutput(name, {
        getter: userOutputGetter.bind(this, name)
      });
    },
    registerInputIfNeeded: function (name) {
      var _this = this;

      if (this.hasInput(name)) {
        return;
      }

      const dynamicSignals = {
        storageFetch: this.fetch.bind(this)
      };

      if (dynamicSignals[name])
        return this.registerInput(name, {
          set: EdgeTriggeredInput.createSetter({
            valueChangedToTrue: dynamicSignals[name]
          })
        });

      const dynamicSetters = {
        collectionName: this.setCollectionName.bind(this)
      };

      if (dynamicSetters[name])
        return this.registerInput(name, {
          set: dynamicSetters[name]
        });

      this.registerInput(name, {
        set: userInputSetter.bind(this, name)
      });
    }
  }
};

function userOutputGetter(name) {
  /* jshint validthis:true */
  return this._internal.storageSettings[name];
}

function userInputSetter(name, value) {
  /* jshint validthis:true */
  this._internal.storageSettings[name] = value;
}

const _defaultJSONQuery =
  '// Write your query script here, check out the reference documentation for examples\n' + 'where({ })\n';

function updatePorts(nodeId, parameters, editorConnection, dbCollections) {
  var ports = [];

  ports.push({
    name: 'collectionName',
    type: {
      name: 'enum',
      enums:
        dbCollections !== undefined
          ? dbCollections.map((c) => {
              return { value: c.name, label: c.name };
            })
          : [],
      allowEditOnly: true
    },
    displayName: 'Collecton Name',
    plug: 'input',
    group: 'General'
  });

  ports.push({
    name: 'storageFilterType',
    type: {
      name: 'enum',
      allowEditOnly: true,
      enums: [
        { value: 'simple', label: 'Simple' },
        { value: 'json', label: 'Advanced' }
      ]
    },
    displayName: 'Filter',
    default: 'simple',
    plug: 'input',
    group: 'General'
  });

  // Limit
  ports.push({
    type: 'boolean',
    plug: 'input',
    group: 'Limit',
    name: 'storageEnableLimit',
    displayName: 'Use limit'
  });

  if (parameters['storageEnableLimit']) {
    ports.push({
      type: 'number',
      default: 10,
      plug: 'input',
      group: 'Limit',
      name: 'storageLimit',
      displayName: 'Limit'
    });

    ports.push({
      type: 'number',
      default: 0,
      plug: 'input',
      group: 'Limit',
      name: 'storageSkip',
      displayName: 'Skip'
    });
  }

  ports.push({
    type: 'signal',
    plug: 'input',
    group: 'Storage',
    name: 'storageFetch',
    displayName: 'Fetch'
  });

  // Simple query
  if (parameters['storageFilterType'] === undefined || parameters['storageFilterType'] === 'simple') {
    ports.push({
      type: { name: 'stringlist', allowEditOnly: true },
      plug: 'input',
      group: 'Filter',
      name: 'storageFilter',
      displayName: 'Filter'
    });

    const filterOps = {
      string: [
        { value: 'eq', label: 'Equals' },
        { value: 'ne', label: 'Not Equals' }
      ],
      boolean: [
        { value: 'eq', label: 'Equals' },
        { value: 'ne', label: 'Not Equals' }
      ],
      number: [
        { value: 'eq', label: 'Equals' },
        { value: 'ne', label: 'Not Equals' },
        { value: 'lt', label: 'Less than' },
        { value: 'gt', label: 'Greater than' },
        { value: 'gte', label: 'Greater than or equal' },
        { value: 'lte', label: 'Less than or equal' }
      ]
    };

    if (parameters['storageFilter']) {
      var filters = parameters['storageFilter'].split(',');
      filters.forEach((f) => {
        // Type
        ports.push({
          type: {
            name: 'enum',
            enums: [
              { value: 'string', label: 'String' },
              { value: 'number', label: 'Number' },
              { value: 'boolean', label: 'Boolean' }
            ]
          },
          default: 'string',
          plug: 'input',
          group: f + ' filter',
          displayName: 'Type',
          editorName: f + ' filter | Type',
          name: 'storageFilterType-' + f
        });

        var type = parameters['storageFilterType-' + f];

        // String filter type
        ports.push({
          type: { name: 'enum', enums: filterOps[type || 'string'] },
          default: 'eq',
          plug: 'input',
          group: f + ' filter',
          displayName: 'Op',
          editorName: f + ' filter| Op',
          name: 'storageFilterOp-' + f
        });

        ports.push({
          type: type || 'string',
          plug: 'input',
          group: f + ' filter',
          displayName: 'Value',
          editorName: f + ' Filter Value',
          name: 'storageFilterValue-' + f
        });
      });
    }

    ports.push({
      type: { name: 'stringlist', allowEditOnly: true },
      plug: 'input',
      group: 'Sort',
      name: 'storageSort',
      displayName: 'Sort'
    });

    // Sorting inputs
    if (parameters['storageSort']) {
      var filters = parameters['storageSort'].split(',');
      filters.forEach((f) => {
        ports.push({
          type: {
            name: 'enum',
            enums: [
              { value: 'ascending', label: 'Ascending' },
              { value: 'descending', label: 'Descending' }
            ]
          },
          default: 'ascending',
          plug: 'input',
          group: f + ' sort',
          displayName: 'Sort',
          editorName: f + ' sorting',
          name: 'storageSort-' + f
        });
      });
    }
  }
  // JSON query
  else if (parameters['storageFilterType'] === 'json') {
    ports.push({
      type: { name: 'string', allowEditOnly: true, codeeditor: 'javascript' },
      plug: 'input',
      group: 'Filter',
      name: 'storageJSONFilter',
      default: _defaultJSONQuery,
      displayName: 'Filter'
    });

    var filter = parameters['storageJSONFilter'];
    if (filter) {
      filter = filter.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove comments
      var variables = filter.match(/\$[A-Za-z0-9]+/g);

      if (variables) {
        const unique = {};
        variables.forEach((v) => {
          unique[v] = true;
        });

        Object.keys(unique).forEach((p) => {
          ports.push({
            name: 'storageFilterValue-' + p.substring(1),
            displayName: p.substring(1),
            group: 'Filter Values',
            plug: 'input',
            type: { name: '*', allowConnectionsOnly: true }
          });
        });
      }

      // Support variables with the "Inputs."" syntax
      JavascriptNodeParser.parseAndAddPortsFromScript(filter, ports, {
        inputPrefix: 'storageFilterValue-',
        inputGroup: 'Filter Values',
        inputType: { name: '*', allowConnectionsOnly: true },
        skipOutputs: true
      });
    }
  }

  editorConnection.sendDynamicPorts(nodeId, ports);
}

module.exports = {
  node: DbCollectionNode,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('dbCollections'));

      node.on('parameterUpdated', function (event) {
        if (event.name.startsWith('storage')) {
          updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('dbCollections'));
        }
      });

      graphModel.on('metadataChanged.dbCollections', function (data) {
        CloudStore.invalidateCollections();
        updatePorts(node.id, node.parameters, context.editorConnection, data);
      });

      graphModel.on('metadataChanged.cloudservices', function (data) {
        CloudStore.instance._initCloudServices();
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.DbCollection', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('DbCollection')) {
        _managePortsForNode(node);
      }
    });
  }
};
