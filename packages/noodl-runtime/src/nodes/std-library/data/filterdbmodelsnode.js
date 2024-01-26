'use strict';

const { Node } = require('../../../../noodl-runtime');

const Collection = require('../../../collection'),
  Model = require('../../../model'),
  CloudStore = require('../../../api/cloudstore'),
  QueryUtils = require('../../../api/queryutils');

var FilterDBModelsNode = {
  name: 'FilterDBModels',
  docs: 'https://docs.noodl.net/nodes/data/cloud-data/filter-records',
  displayNodeName: 'Filter Records',
  shortDesc: 'Filter, sort and limit array',
  category: 'Data',
  color: 'data',
  initialize: function () {
    var _this = this;

    this._internal.collectionChangedCallback = function () {
      if (_this.isInputConnected('filter') === true) return;

      _this.scheduleFilter();
    };

    this._internal.cloudStoreEvents = function (args) {
      if (_this.isInputConnected('filter') === true) return;

      if (_this._internal.visualFilter === undefined) return;
      if (_this._internal.collection === undefined) return;
      if (args.collection !== _this._internal.collectionName) return;

      if (args.objectId !== undefined && _this._internal.collection.contains(Model.get(args.objectId)))
        _this.scheduleFilter();
    };

    CloudStore.instance.on('save', this._internal.cloudStoreEvents);

    this._internal.enabled = true;
    this._internal.filterSettings = {};
    this._internal.filterParameters = {};
    //   this._internal.filteredCollection = Collection.get();
  },
  getInspectInfo() {
    const collection = this._internal.filteredCollection;

    if (!collection) {
      return { type: 'text', value: '[Not executed yet]' };
    }

    return [
      {
        type: 'text',
        value: 'Id: ' + collection.getId()
      },
      {
        type: 'value',
        value: collection.items
      }
    ];
  },
  inputs: {
    items: {
      type: 'array',
      displayName: 'Items',
      group: 'General',
      set(value) {
        this.bindCollection(value);
        if (this.isInputConnected('filter') === false) this.scheduleFilter();
      }
    },
    enabled: {
      type: 'boolean',
      group: 'General',
      displayName: 'Enabled',
      default: true,
      set: function (value) {
        this._internal.enabled = value;
        if (this.isInputConnected('filter') === false) this.scheduleFilter();
      }
    },
    filter: {
      type: 'signal',
      group: 'Actions',
      displayName: 'Filter',
      valueChangedToTrue: function () {
        this.scheduleFilter();
      }
    }
  },
  outputs: {
    items: {
      type: 'array',
      displayName: 'Items',
      group: 'General',
      getter: function () {
        return this._internal.filteredCollection;
      }
    },
    firstItemId: {
      type: 'string',
      displayName: 'First Record Id',
      group: 'General',
      getter: function () {
        if (this._internal.filteredCollection !== undefined) {
          const firstItem = this._internal.filteredCollection.get(0);
          if (firstItem !== undefined) return firstItem.getId();
        }
      }
    },
    /*   firstItem:{
            type: 'object',
            displayName: 'First Item',
            group: 'General',
            getter: function () {
                if(this._internal.filteredCollection !== undefined) {
                    return this._internal.filteredCollection.get(0);
                }
            }            
        },  */
    count: {
      type: 'number',
      displayName: 'Count',
      group: 'General',
      getter: function () {
        return this._internal.filteredCollection ? this._internal.filteredCollection.size() : 0;
      }
    },
    modified: {
      group: 'Events',
      type: 'signal',
      displayName: 'Filtered'
    }
  },
  prototypeExtensions: {
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

      CloudStore.instance.off('save', this._internal.cloudStoreEvents);
    },
    /* getFilter: function () {
            const filterSettings = this._internal.filterSettings;

            const options = ['case'] // List all supported options here

            if (filterSettings['filterFilter']) {
                const filters = filterSettings['filterFilter'].split(',');
                var _filter = {};
                filters.forEach(function (f) {
                    var op = '$' + (filterSettings['filterFilterOp-' + f] || 'eq');
                    _filter[f] = {};
                    _filter[f][op] = filterSettings['filterFilterValue-' + f];

                    options.forEach((o) => {
                        var option = filterSettings['filterFilterOption-' + o + '-' + f];
                        if(option) _filter[f]['$' + o] =  option
                    })
                })
                return _filter;
            }
        },
        getSort: function() {
            const filterSettings = this._internal.filterSettings;

            if (filterSettings['filterSort']) {
                const sort = filterSettings['filterSort'].split(',');
                var _sort = {};
                sort.forEach(function (s) {
                    _sort[s] = filterSettings['filterSort-'+s] === 'descending'?-1:1;
                })
                return _sort;
            }
        },*/
    getLimit: function () {
      const filterSettings = this._internal.filterSettings;

      if (!filterSettings['filterEnableLimit']) return;
      else return filterSettings['filterLimit'] || 10;
    },
    getSkip: function () {
      const filterSettings = this._internal.filterSettings;

      if (!filterSettings['filterEnableLimit']) return;
      else return filterSettings['filterSkip'] || 0;
    },
    scheduleFilter: function () {
      if (this.collectionChangedScheduled) return;
      this.collectionChangedScheduled = true;

      this.scheduleAfterInputsHaveUpdated(() => {
        this.collectionChangedScheduled = false;
        if (!this._internal.collection) return;

        // Apply filter and write to output collection
        var filtered = [].concat(this._internal.collection.items);

        if (this._internal.enabled) {
          const _filter = this._internal.visualFilter;
          if (_filter !== undefined) {
            var filter = QueryUtils.convertVisualFilter(_filter, {
              queryParameters: this._internal.filterParameters,
              collectionName: this._internal.collectionName
            });
            if (filter) filtered = filtered.filter((m) => QueryUtils.matchesQuery(m, filter));
          }

          var _sort = this._internal.visualSorting;
          if (_sort !== undefined && _sort.length > 0) {
            var sort = QueryUtils.convertVisualSorting(_sort);
          }
          if (sort) filtered.sort(QueryUtils.compareObjects.bind(this, sort));

          var skip = this.getSkip();
          if (skip) filtered = filtered.slice(skip, filtered.length);

          var limit = this.getLimit();
          if (limit) filtered = filtered.slice(0, limit);
        }

        this._internal.filteredCollection = Collection.create(filtered);

        this.sendSignalOnOutput('modified');
        this.flagOutputDirty('firstItemId');
        this.flagOutputDirty('items');
        this.flagOutputDirty('count');
      });
    },
    setCollectionName: function (name) {
      this._internal.collectionName = name;
    },
    setVisualFilter: function (value) {
      this._internal.visualFilter = value;

      if (this.isInputConnected('filter') === false) this.scheduleFilter();
    },
    setVisualSorting: function (value) {
      this._internal.visualSorting = value;

      if (this.isInputConnected('filter') === false) this.scheduleFilter();
    },
    setFilterParameter: function (name, value) {
      this._internal.filterParameters[name] = value;

      if (this.isInputConnected('filter') === false) this.scheduleFilter();
    },
    registerInputIfNeeded: function (name) {
      var _this = this;

      if (this.hasInput(name)) {
        return;
      }

      if (name === 'collectionName')
        return this.registerInput(name, {
          set: this.setCollectionName.bind(this)
        });

      if (name === 'visualFilter')
        return this.registerInput(name, {
          set: this.setVisualFilter.bind(this)
        });

      if (name === 'visualSorting')
        return this.registerInput(name, {
          set: this.setVisualSorting.bind(this)
        });

      if (name.startsWith('fp-'))
        return this.registerInput(name, {
          set: this.setFilterParameter.bind(this, name.substring('fp-'.length))
        });

      this.registerInput(name, {
        set: userInputSetter.bind(this, name)
      });
    }
  }
};

function userInputSetter(name, value) {
  /* jshint validthis:true */
  this._internal.filterSettings[name] = value;
  if (this.isInputConnected('filter') === false) this.scheduleFilter();
}

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
    displayName: 'Class',
    plug: 'input',
    group: 'General'
  });

  ports.push({
    type: 'boolean',
    plug: 'input',
    group: 'Limit',
    name: 'filterEnableLimit',
    displayName: 'Use limit'
  });

  if (parameters['filterEnableLimit']) {
    ports.push({
      type: 'number',
      default: 10,
      plug: 'input',
      group: 'Limit',
      name: 'filterLimit',
      displayName: 'Limit'
    });

    ports.push({
      type: 'number',
      default: 0,
      plug: 'input',
      group: 'Limit',
      name: 'filterSkip',
      displayName: 'Skip'
    });
  }

  if (parameters.collectionName !== undefined) {
    var c = dbCollections.find((c) => c.name === parameters.collectionName);
    if (c && c.schema && c.schema.properties) {
      const schema = JSON.parse(JSON.stringify(c.schema));

      const _supportedTypes = {
        Boolean: true,
        String: true,
        Date: true,
        Number: true,
        Pointer: true
      };
      for (var key in schema.properties) {
        if (!_supportedTypes[schema.properties[key].type]) delete schema.properties[key];
      }

      ports.push({
        name: 'visualFilter',
        plug: 'input',
        type: { name: 'query-filter', schema: schema, allowEditOnly: true },
        displayName: 'Filter',
        group: 'Filter'
      });

      ports.push({
        name: 'visualSorting',
        plug: 'input',
        type: { name: 'query-sorting', schema: schema, allowEditOnly: true },
        displayName: 'Sorting',
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
          name: 'fp-' + input,
          plug: 'input',
          type: '*',
          displayName: input,
          group: 'Filter Parameters'
        });
      });
    }
  }

  /*  ports.push({
        type: { name: 'stringlist', allowEditOnly: true },
        plug: 'input',
        group: 'Filter',
        name: 'filterFilter',
        displayName: 'Filter',
    })

    ports.push({
        type: { name: 'stringlist', allowEditOnly: true },
        plug: 'input',
        group: 'Sort',
        name: 'filterSort',
        displayName: 'Sort',
    })    

    const filterOps = {
        "string": [{ value: 'eq', label: 'Equals' }, { value: 'neq', label: 'Not Equals' },{value: 'regex', label: 'Matches RegEx'}],
        "boolean": [{ value: 'eq', label: 'Equals' }, { value: 'neq', label: 'Not Equals' }],
        "number": [{ value: 'eq', label: 'Equals' }, { value: 'neq', label: 'Not Equals' }, { value: 'lt', label: 'Less than' }, { value: 'gt', label: 'Greater than' },
        { value: 'gte', label: 'Greater than or equal' }, { value: 'lte', label: 'Less than or equal' }]
    }

    if (parameters['filterFilter']) {
        var filters = parameters['filterFilter'].split(',');
        filters.forEach((f) => {
            // Type
            ports.push({
                type: { name: 'enum', enums: [{ value: 'string', label: 'String' }, { value: 'number', label: 'Number' }, { value: 'boolean', label: 'Boolean' }] },
                default: 'string',
                plug: 'input',
                group: f + ' filter',
                displayName: 'Type',
                editorName: f + ' filter | Type',
                name: 'filterFilterType-' + f
            })

            var type = parameters['filterFilterType-' + f];

            // String filter type
            ports.push({
                type: { name: 'enum', enums: filterOps[type || 'string'] },
                default: 'eq',
                plug: 'input',
                group: f + ' filter',
                displayName: 'Op',
                editorName: f + ' filter| Op',
                name: 'filterFilterOp-' + f
            })

            // Case sensitivite option
            if(parameters['filterFilterOp-' + f] === 'regex') {
                ports.push({
                    type: 'boolean',
                    default: false,
                    plug: 'input',
                    group: f + ' filter',
                    displayName: 'Case sensitive',
                    editorName: f + ' filter| Case',
                    name: 'filterFilterOption-case-' + f
                })
            }

            ports.push({
                type: type || 'string',
                plug: 'input',
                group: f + ' filter',
                displayName: 'Value',
                editorName: f + ' Filter Value',
                name: 'filterFilterValue-' + f
            })

        })
    }

    if (parameters['filterSort']) {
        var filters = parameters['filterSort'].split(',');
        filters.forEach((f) => {
            ports.push({
                type: { name: 'enum', enums: [{ value: 'ascending', label: 'Ascending' }, { value: 'descending', label: 'Descending' }] },
                default: 'ascending',
                plug: 'input',
                group: f + ' sort',
                displayName: 'Sort',
                editorName: f + ' sorting',
                name: 'filterSort-' + f
            })
        })
    }*/

  editorConnection.sendDynamicPorts(nodeId, ports);
}

module.exports = {
  node: FilterDBModelsNode,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    graphModel.on('nodeAdded.FilterDBModels', function (node) {
      updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('dbCollections'));

      node.on('parameterUpdated', function (event) {
        updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('dbCollections'));
      });

      graphModel.on('metadataChanged.dbCollections', function (data) {
        CloudStore.invalidateCollections();
        updatePorts(node.id, node.parameters, context.editorConnection, data);
      });

      graphModel.on('metadataChanged.systemCollections', function (data) {
        CloudStore.invalidateCollections();
        updatePorts(node.id, node.parameters, context.editorConnection, data);
      });
    });
  }
};
