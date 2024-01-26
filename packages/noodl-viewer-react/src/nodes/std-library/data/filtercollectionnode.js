'use strict';

const { Node, EdgeTriggeredInput } = require('@noodl/runtime');

const Collection = require('@noodl/runtime/src/collection'),
  Model = require('@noodl/runtime/src/model');

function applyFilter(item, filter) {
  for (var key in filter) {
    var op = filter[key];

    //check neq first, it's the only operation where the key can be undefined
    if (op['$neq'] !== undefined) {
      if (!(item[key] != op['$neq'])) return false;
    } else if (item[key] === undefined) return false;
    // The key does not exist, always return false
    else if (op['$eq'] !== undefined && !(item[key] == op['$eq'])) return false;
    else if (op['$gt'] !== undefined && !(item[key] > op['$gt'])) return false;
    else if (op['$lt'] !== undefined && !(item[key] < op['$lt'])) return false;
    else if (op['$gte'] !== undefined && !(item[key] >= op['$gte'])) return false;
    else if (op['$lte'] !== undefined && !(item[key] <= op['$lte'])) return false;
    else if (op['$regex'] !== undefined) {
      // Test if string matches regex
      var a = item[key] + ''; // Convert to string
      var regex = new RegExp(op['$regex'], op['$case'] !== true ? 'i' : undefined);

      if (!regex.test(a)) return false;
    }
  }

  return true;
}

function sorter(a, b) {
  if (a instanceof Model) a = a.data;
  if (b instanceof Model) b = b.data;

  for (var key in this) {
    var _a = a[key];
    var _b = b[key];
    if (_a !== _b) {
      if (typeof _a === 'string' && typeof _b === 'string') {
        if (this[key] === 1) {
          return _a > _b ? 1 : -1;
        } else return _a > _b ? -1 : 1;
      } else if (typeof _a === 'number' && typeof _b === 'number') {
        return this[key] === 1 ? _a - _b : _b - _a;
      } else {
        if (this[key] === 1) {
          return _a > _b ? 1 : -1;
        } else return _a > _b ? -1 : 1;
      }
    }
  }
  return 0;
}

var FilterCollectionNode = {
  name: 'Filter Collection',
  docs: 'https://docs.noodl.net/nodes/data/array/array-filter',
  displayNodeName: 'Array Filter',
  shortDesc: 'Filter, sort and limit array',
  category: 'Data',
  color: 'data',
  initialize: function () {
    var _this = this;

    this._internal.collectionChangedCallback = function () {
      if (_this.isInputConnected('filter') === true) return;

      _this.scheduleFilter();
    };

    this._internal.enabled = true;
    this._internal.filterSettings = {};
    //this._internal.filteredCollection = Collection.get();
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
      displayName: 'First Item Id',
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
    },
    getFilter: function () {
      const filterSettings = this._internal.filterSettings;

      const options = ['case']; // List all supported options here

      if (filterSettings['filterFilter']) {
        const filters = filterSettings['filterFilter'].split(',');
        var _filter = {};
        filters.forEach(function (f) {
          var op = '$' + (filterSettings['filterFilterOp-' + f] || 'eq');
          _filter[f] = {};
          _filter[f][op] = filterSettings['filterFilterValue-' + f];

          options.forEach((o) => {
            var option = filterSettings['filterFilterOption-' + o + '-' + f];
            if (option) _filter[f]['$' + o] = option;
          });
        });
        return _filter;
      }
    },
    getSort: function () {
      const filterSettings = this._internal.filterSettings;

      if (filterSettings['filterSort']) {
        const sort = filterSettings['filterSort'].split(',');
        var _sort = {};
        sort.forEach(function (s) {
          _sort[s] = filterSettings['filterSort-' + s] === 'descending' ? -1 : 1;
        });
        return _sort;
      }
    },
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
        var filtered = [].concat(this._internal.collection.items); // Make sure we clone the array

        if (this._internal.enabled) {
          var filter = this.getFilter();
          if (filter) filtered = filtered.filter((m) => applyFilter(m.data, filter));

          var sort = this.getSort();
          if (sort) filtered.sort(sorter.bind(sort));

          var skip = this.getSkip();
          if (skip) filtered = filtered.slice(skip, filtered.length);

          var limit = this.getLimit();
          if (limit) filtered = filtered.slice(0, limit);
        }

        this._internal.filteredCollection = Collection.create(filtered);

        this.sendSignalOnOutput('modified');
        this.flagOutputDirty('firstItemId');
        this.flagOutputDirty('items');
        // this.flagOutputDirty('firstItem');
        this.flagOutputDirty('count');
      });
    },
    registerInputIfNeeded: function (name) {
      var _this = this;

      if (this.hasInput(name)) {
        return;
      }

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

  ports.push({
    type: { name: 'stringlist', allowEditOnly: true },
    plug: 'input',
    group: 'Filter',
    name: 'filterFilter',
    displayName: 'Filter'
  });

  ports.push({
    type: { name: 'stringlist', allowEditOnly: true },
    plug: 'input',
    group: 'Sort',
    name: 'filterSort',
    displayName: 'Sort'
  });

  const filterOps = {
    string: [
      { value: 'eq', label: 'Equals' },
      { value: 'neq', label: 'Not Equals' },
      { value: 'regex', label: 'Matches RegEx' }
    ],
    boolean: [
      { value: 'eq', label: 'Equals' },
      { value: 'neq', label: 'Not Equals' }
    ],
    number: [
      { value: 'eq', label: 'Equals' },
      { value: 'neq', label: 'Not Equals' },
      { value: 'lt', label: 'Less than' },
      { value: 'gt', label: 'Greater than' },
      { value: 'gte', label: 'Greater than or equal' },
      { value: 'lte', label: 'Less than or equal' }
    ]
  };

  if (parameters['filterFilter']) {
    var filters = parameters['filterFilter'].split(',');
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
        name: 'filterFilterType-' + f
      });

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
      });

      // Case sensitivite option
      if (parameters['filterFilterOp-' + f] === 'regex') {
        ports.push({
          type: 'boolean',
          default: false,
          plug: 'input',
          group: f + ' filter',
          displayName: 'Case sensitive',
          editorName: f + ' filter| Case',
          name: 'filterFilterOption-case-' + f
        });
      }

      ports.push({
        type: type || 'string',
        plug: 'input',
        group: f + ' filter',
        displayName: 'Value',
        editorName: f + ' Filter Value',
        name: 'filterFilterValue-' + f
      });
    });
  }

  if (parameters['filterSort']) {
    var filters = parameters['filterSort'].split(',');
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
        name: 'filterSort-' + f
      });
    });
  }

  editorConnection.sendDynamicPorts(nodeId, ports);
}

module.exports = {
  node: FilterCollectionNode,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    graphModel.on('nodeAdded.Filter Collection', function (node) {
      updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('dbCollections'));

      node.on('parameterUpdated', function (event) {
        if (event.name.startsWith('filter')) {
          updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('dbCollections'));
        }
      });

      graphModel.on('metadataChanged.dbCollections', function (data) {
        updatePorts(node.id, node.parameters, context.editorConnection, data);
      });
    });
  }
};
