const { Node, EdgeTriggeredInput } = require('../../../../noodl-runtime');

const Model = require('../../../model'),
  Collection = require('../../../collection'),
  CloudStore = require('../../../api/cloudstore'),
  JavascriptNodeParser = require('../../../javascriptnodeparser'),
  QueryUtils = require('../../../api/queryutils');

var DbCollectionNode = {
  name: 'DbCollection2',
  docs: 'https://docs.noodl.net/nodes/data/cloud-data/query-records',
  displayName: 'Query Records',
  /* shortDesc: "A database collection.",*/
  category: 'Cloud Services',
  usePortAsLabel: 'collectionName',
  color: 'data',
  initialize: function () {
    var _this = this;
    this._internal.queryParameters = {};

    var collectionChangedScheduled = false;
    this._internal.collectionChangedCallback = function () {
      //this can be called multiple times when adding/removing more than one item
      //so optimize by only updating outputs once
      if (collectionChangedScheduled) return;
      collectionChangedScheduled = true;

      _this.scheduleAfterInputsHaveUpdated(function () {
        _this.flagOutputDirty('count');
        _this.flagOutputDirty('firstItemId');
        _this.flagOutputDirty('isEmpty');
        collectionChangedScheduled = false;
      });
    };

    this._internal.cloudStoreEvents = function (args) {
      if (_this.isInputConnected('storageFetch') === true) return;

      if (_this._internal.collection === undefined) return;
      if (args.collection !== _this._internal.name) return;

      function _addModelAtCorrectIndex(m) {
        if (_this._internal.currentQuery.sort !== undefined) {
          // We need to add it at the right index
          for (var i = 0; i < _this._internal.collection.size(); i++)
            if (QueryUtils.compareObjects(_this._internal.currentQuery.sort, _this._internal.collection.get(i), m) > 0)
              break;

          _this._internal.collection.addAtIndex(m, i);
        } else {
          _this._internal.collection.add(m);
        }

        // Make sure we don't exceed limit
        let size = _this._internal.collection.size();
        if (_this._internal.currentQuery.limit !== undefined && size > _this._internal.currentQuery.limit)
          _this._internal.collection.remove(
            _this._internal.collection.get(
              _this._internal.currentQuery.sort !== undefined && _this._internal.currentQuery.sort[0][0] === '-'
                ? size - 1
                : 0
            )
          );

        //Send the array again over the items output to trigger function nodes etc that might be connected
        _this.flagOutputDirty('items');

        _this.flagOutputDirty('count');
        _this.flagOutputDirty('firstItemId');
        _this.flagOutputDirty('isEmpty');
      }

      if (args.type === 'create') {
        const m = Model.get(args.object.objectId);
        if (m !== undefined) {
          // Check if the object matches the current query
          if (QueryUtils.matchesQuery(m, _this._internal.currentQuery.where)) {
            // If matches the query, add the item to results
            _addModelAtCorrectIndex(m);
          }
        }
      } else if (args.type === 'save') {
        const m = Model.get(args.objectId);
        if (m !== undefined) {
          const matchesQuery = QueryUtils.matchesQuery(m, _this._internal.currentQuery.where);

          if (!matchesQuery && _this._internal.collection.contains(m)) {
            // The record no longer matches the filter, remove it
            _this._internal.collection.remove(m);

            //Send the array again over the items output to trigger function nodes etc that might be connected
            _this.flagOutputDirty('items');

            _this.flagOutputDirty('count');
            _this.flagOutputDirty('firstItemId');
            _this.flagOutputDirty('isEmpty');
          } else if (matchesQuery && !_this._internal.collection.contains(m)) {
            // It's not part of the result collection but now matches they query, add it and resort
            _addModelAtCorrectIndex(m);
          }
        }
      } else if (args.type === 'delete') {
        const m = Model.get(args.objectId);
        if (m !== undefined) {
          _this._internal.collection.remove(m);

          //Send the array again over the items output to trigger function nodes etc that might be connected
          _this.flagOutputDirty('items');

          _this.flagOutputDirty('count');
          _this.flagOutputDirty('firstItemId');
          _this.flagOutputDirty('isEmpty');
        }
      }
    };

    // Listening to cloud store events is only for the global model scope, only valid in browser
    // in cloud runtime its a nop
    const cloudstore = CloudStore.forScope(this.nodeScope.modelScope);
    cloudstore.on('save', this._internal.cloudStoreEvents);
    cloudstore.on('create', this._internal.cloudStoreEvents);
    cloudstore.on('delete', this._internal.cloudStoreEvents);

    this._internal.storageSettings = {};
  },
  getInspectInfo() {
    const collection = this._internal.collection;
    if (!collection) {
      return { type: 'text', value: '[Not executed yet]' };
    }

    return [
      {
        type: 'value',
        value: collection.items
      }
    ];
  },
  inputs: {},
  outputs: {
    items: {
      type: 'array',
      displayName: 'Items',
      group: 'General',
      getter: function () {
        return this._internal.collection;
      }
    },
    firstItemId: {
      type: 'string',
      displayName: 'First Record Id',
      group: 'General',
      getter: function () {
        if (this._internal.collection) {
          var firstItem = this._internal.collection.get(0);
          if (firstItem !== undefined) return firstItem.getId();
        }
      }
    },
    isEmpty: {
      type: 'boolean',
      displayName: 'Is Empty',
      group: 'General',
      getter: function () {
        if (this._internal.collection) {
          return this._internal.collection.size() === 0;
        }
        return true;
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
    fetched: {
      group: 'Events',
      type: 'signal',
      displayName: 'Success'
    },
    failure: {
      group: 'Events',
      type: 'signal',
      displayName: 'Failure'
    },
    error: {
      type: 'string',
      displayName: 'Error',
      group: 'Error',
      getter: function () {
        return this._internal.error;
      }
    }
  },
  prototypeExtensions: {
    setCollectionName: function (name) {
      this._internal.name = name;

      if (this.isInputConnected('storageFetch') === false) this.scheduleFetch();
    },
    setCollection: function (collection) {
      this.bindCollection(collection);
      this.flagOutputDirty('firstItemId');
      this.flagOutputDirty('isEmpty');
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

      const cloudstore = CloudStore.forScope(this.nodeScope.modelScope);
      cloudstore.off('insert', this._internal.cloudStoreEvents);
      cloudstore.off('delete', this._internal.cloudStoreEvents);
      cloudstore.off('save', this._internal.cloudStoreEvents);
    },
    setError: function (err) {
      this._internal.err = err;
      this.flagOutputDirty('error');
      this.sendSignalOnOutput('failure');
    },
    scheduleFetch: function () {
      var internal = this._internal;

      if (internal.fetchScheduled) return;
      internal.fetchScheduled = true;
      this.scheduleAfterInputsHaveUpdated(() => {
        internal.fetchScheduled = false;

        this.fetch();
      });
    },
    fetch: function () {
      if (this.context.editorConnection) {
        if (this._internal.name === undefined) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'query-collection', {
            message: 'No collection specified for query'
          });
        } else {
          this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'query-collection');
        }
      }

      const _c = Collection.get();
      const f = this.getStorageFilter();
      const limit = this.getStorageLimit();
      const skip = this.getStorageSkip();
      const count = this.getStorageFetchTotalCount();
      this._internal.currentQuery = {
        where: f.where,
        sort: f.sort,
        limit: limit,
        skip: skip
      };
      CloudStore.forScope(this.nodeScope.modelScope).query({
        collection: this._internal.name,
        where: f.where,
        sort: f.sort,
        limit: limit,
        skip: skip,
        count: count,
        success: (results, count) => {
          if (results !== undefined) {
            _c.set(
              results.map((i) => {
                var m = CloudStore._fromJSON(i, this._internal.name, this.nodeScope.modelScope);

                return m;
              })
            );
          }
          if (count !== undefined) {
            this._internal.storageSettings.storageTotalCount = count;
            if (this.hasOutput('storageTotalCount')) this.flagOutputDirty('storageTotalCount');
          }
          this.setCollection(_c);
          this.sendSignalOnOutput('fetched');
        },
        error: (err) => {
          this.setCollection(_c);
          this.setError(err || 'Failed to fetch.');
        }
      });
    },
    getStorageFilter: function () {
      const storageSettings = this._internal.storageSettings;
      if (storageSettings['storageFilterType'] === undefined || storageSettings['storageFilterType'] === 'simple') {
        // Create simple filter
        const _where =
          this._internal.visualFilter !== undefined
            ? QueryUtils.convertVisualFilter(this._internal.visualFilter, {
                queryParameters: this._internal.queryParameters,
                collectionName: this._internal.name
              })
            : undefined;

        const _sort =
          this._internal.visualSorting !== undefined
            ? QueryUtils.convertVisualSorting(this._internal.visualSorting)
            : undefined;

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
          _filter = QueryUtils.convertFilterOp(f, {
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
    getStorageFetchTotalCount: function () {
      const storageSettings = this._internal.storageSettings;

      return !!storageSettings['storageEnableCount'];
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      this.registerOutput(name, {
        getter: userOutputGetter.bind(this, name)
      });
    },
    setVisualFilter: function (value) {
      this._internal.visualFilter = value;

      if (this.isInputConnected('storageFetch') === false) this.scheduleFetch();
    },
    setVisualSorting: function (value) {
      this._internal.visualSorting = value;

      if (this.isInputConnected('storageFetch') === false) this.scheduleFetch();
    },
    setQueryParameter: function (name, value) {
      this._internal.queryParameters[name] = value;

      if (this.isInputConnected('storageFetch') === false) this.scheduleFetch();
    },
    registerInputIfNeeded: function (name) {
      var _this = this;

      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('qp-'))
        return this.registerInput(name, {
          set: this.setQueryParameter.bind(this, name.substring('qp-'.length))
        });

      const dynamicSignals = {
        storageFetch: this.scheduleFetch.bind(this)
      };

      if (dynamicSignals[name])
        return this.registerInput(name, {
          set: EdgeTriggeredInput.createSetter({
            valueChangedToTrue: dynamicSignals[name]
          })
        });

      const dynamicSetters = {
        collectionName: this.setCollectionName.bind(this),
        visualFilter: this.setVisualFilter.bind(this),
        visualSort: this.setVisualSorting.bind(this)
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

  if (this.isInputConnected('storageFetch') === false) this.scheduleFetch();
}

const _defaultJSONQuery =
  '// Write your query script here, check out the reference documentation for examples\n' + 'where({ })\n';

function updatePorts(nodeId, parameters, editorConnection, graphModel) {
  var ports = [];

  const dbCollections = graphModel.getMetaData('dbCollections');
  const systemCollections = graphModel.getMetaData('systemCollections');

  const _systemClasses = [
    { label: 'User', value: '_User' },
    { label: 'Role', value: '_Role' }
  ];
  ports.push({
    name: 'collectionName',
    type: {
      name: 'enum',
      enums: _systemClasses.concat(
        dbCollections !== undefined
          ? dbCollections.map((c) => {
              return { value: c.name, label: c.name };
            })
          : []
      ),
      allowEditOnly: true
    },
    displayName: 'Class',
    plug: 'input',
    group: 'General'
  });

  ports.push({
    name: 'storageFilterType',
    type: {
      name: 'enum',
      allowEditOnly: true,
      enums: [
        { value: 'simple', label: 'Visual' },
        { value: 'json', label: 'Javascript' }
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
    group: 'Actions',
    name: 'storageFetch',
    displayName: 'Do'
  });

  // Total Count
  ports.push({
    type: 'boolean',
    plug: 'input',
    group: 'Total Count',
    name: 'storageEnableCount',
    displayName: 'Fetch total count'
  });

  if (parameters['storageEnableCount']) {
    ports.push({
      type: 'number',
      plug: 'output',
      group: 'General',
      name: 'storageTotalCount',
      displayName: 'Total Count'
    });
  }

  // Simple query
  if (parameters['storageFilterType'] === undefined || parameters['storageFilterType'] === 'simple') {
    if (parameters.collectionName !== undefined) {
      var c = dbCollections && dbCollections.find((c) => c.name === parameters.collectionName);
      if (c === undefined && systemCollections) c = systemCollections.find((c) => c.name === parameters.collectionName);
      if (c && c.schema && c.schema.properties) {
        const schema = JSON.parse(JSON.stringify(c.schema));

        // Find all records that have a relation with this type
        function _findRelations(c) {
          if (c.schema !== undefined && c.schema.properties !== undefined)
            for (var key in c.schema.properties) {
              var p = c.schema.properties[key];
              if (p.type === 'Relation' && p.targetClass === parameters.collectionName) {
                if (schema.relations === undefined) schema.relations = {};
                if (schema.relations[c.name] === undefined) schema.relations[c.name] = [];

                schema.relations[c.name].push({ property: key });
              }
            }
        }

        dbCollections && dbCollections.forEach(_findRelations);
        systemCollections && systemCollections.forEach(_findRelations);

        ports.push({
          name: 'visualFilter',
          plug: 'input',
          type: { name: 'query-filter', schema: schema, allowEditOnly: true },
          displayName: 'Filter',
          group: 'Filter'
        });

        ports.push({
          name: 'visualSort',
          plug: 'input',
          type: { name: 'query-sorting', schema: schema, allowEditOnly: true },
          displayName: 'Sort',
          group: 'Sorting'
        });
      }

      if (parameters.visualFilter !== undefined) {
        // Find all input ports
        const uniqueInputs = {};
        function _collectInputs(query) {
          if (query === undefined) return;
          if (query.rules !== undefined) query.rules.forEach((r) => _collectInputs(r));
          else if (query.input !== undefined) uniqueInputs[query.input] = true;
        }

        _collectInputs(parameters.visualFilter);
        Object.keys(uniqueInputs).forEach((input) => {
          ports.push({
            name: 'qp-' + input,
            plug: 'input',
            type: '*',
            displayName: input,
            group: 'Query Parameters'
          });
        });
      }
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
      updatePorts(node.id, node.parameters, context.editorConnection, graphModel);

      node.on('parameterUpdated', function (event) {
        if (event.name.startsWith('storage') || event.name === 'visualFilter' || event.name === 'collectionName') {
          updatePorts(node.id, node.parameters, context.editorConnection, graphModel);
        }
      });

      graphModel.on('metadataChanged.dbCollections', function (data) {
        CloudStore.invalidateCollections();
        updatePorts(node.id, node.parameters, context.editorConnection, graphModel);
      });

      graphModel.on('metadataChanged.systemCollections', function (data) {
        CloudStore.invalidateCollections();
        updatePorts(node.id, node.parameters, context.editorConnection, graphModel);
      });

      graphModel.on('metadataChanged.cloudservices', function (data) {
        CloudStore.instance._initCloudServices();
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.DbCollection2', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('DbCollection2')) {
        _managePortsForNode(node);
      }
    });
  }
};
