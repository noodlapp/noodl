const { Node, EdgeTriggeredInput } = require('@noodl/runtime');

const CloudStore = require('@noodl/runtime/src/api/cloudstore'),
  JavascriptNodeParser = require('@noodl/runtime/src/javascriptnodeparser'),
  QueryUtils = require('@noodl/runtime/src/api/queryutils');

var AggregateNode = {
  name: 'noodl.cloud.aggregate',
  docs: 'https://docs.noodl.net/nodes/cloud-functions/cloud-data/aggregate-records',
  displayName: 'Aggregate Records',
  category: 'Cloud Services',
  usePortAsLabel: 'collectionName',
  color: 'data',
  initialize: function () {
    this._internal.queryParameters = {};

    this._internal.storageSettings = {};

    this._internal.aggregates = {};
  },
  getInspectInfo() {
    const aggregates = this._internal.aggregateValues;
    if (!aggregates) {
      return { type: 'text', value: '[Not executed yet]' };
    }

    return [
      {
        type: 'value',
        value: aggregates
      }
    ];
  },
  inputs: {
    aggregates:{
        index:100,
        group:"Aggregates",
        type:{name:"stringlist",allowEditOnly:true},
        displayName:"Aggregates",
        set:function(value) {
            this._internal.aggregatesList = value;
        }
    }
  },
  outputs: {
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
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);
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
        let validateAggNames = true;
        if(this._internal.aggregatesList) {
            this._internal.aggregatesList.split(',').forEach(k => {
                if(k.indexOf(' ')!==-1)
                    validateAggNames = false;
            })
        }

        if (this._internal.name === undefined) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'aggregate-node', {
            message: 'No class specified for aggregate.'
          });
        }
        else if(this._internal.aggregatesList === undefined) {
            this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'aggregate-node', {
                message: 'No aggregates specified.'
              });
        }
        else if(!validateAggNames) {
            this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'aggregate-node', {
                message: 'Invalid aggregate names, dont use space and special characters.'
              });
        }
        else {
          this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'aggregate-node');
        }
      }

      const f = this.getStorageFilter();
      this._internal.currentQuery = {
        where: f.where,
      };
      CloudStore.forScope(this.nodeScope.modelScope).aggregate({
        collection: this._internal.name,
        where: f.where,
        group: this.getAggregates(),
        success: (results) => {
            this._internal.aggregateValues = results;
            for(const key in results) {
                if(this.hasOutput('agg-'+key))
                    this.flagOutputDirty('agg-'+key);
            }
          this.sendSignalOnOutput('fetched');
        },
        error: (err) => {
          this.setError(err || 'Failed to aggregate.');
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

        return {
          where: _where,
        };
      } else if (storageSettings['storageFilterType'] === 'json') {
        // JSON filter
        if (!this._internal.filterFunc) {
          try {
            var filterCode = storageSettings['storageJSONFilter'];

            // Parse out variables
            filterCode = filterCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove comments
            this._internal.filterVariables = filterCode.match(/\$[A-Za-z0-9]+/g) || [];

            var args = ['where', 'Inputs']
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
          _this = this;

        // Collect filter variables
        var _filterCb = function (f) {
          _filter = QueryUtils.convertFilterOp(f, {
            collectionName: _this._internal.name,
            error: function (err) {
              _this.context.editorConnection.sendWarning(
                _this.nodeScope.componentOwner.name,
                _this.id,
                'aggregate-node-filter',
                {
                  message: err
                }
              );
            }
          });
        };

        // Extract inputs
        const inputs = {};
        for (let key in storageSettings) {
          if (key.startsWith('storageFilterValue-'))
            inputs[key.substring('storageFilterValue-'.length)] = storageSettings[key];
        }

        var filterFuncArgs = [ _filterCb, inputs]; // One for filter, one for where

        this._internal.filterVariables.forEach((v) => {
          filterFuncArgs.push(storageSettings['storageFilterValue-' + v.substring(1)]);
        });

        // Run the code to get the filter
        try {
          this._internal.filterFunc.apply(this, filterFuncArgs);
        } catch (e) {
          console.log('Error while running filter script: ' + e);
        }

        return { where: _filter };
      }
    },
    getAggregates:function() {
        if(!this._internal.aggregatesList) return {};
        if(!this._internal.aggregates) return {};

        const schema = CloudStore._collections;
        const classSchema = schema[this._internal.name];
        if(!classSchema || !classSchema.schema || !classSchema.schema.properties) return {};

        const defs = this._internal.aggregates;
        const aggs = {};
        this._internal.aggregatesList.split(',').forEach(a => {
            if(defs[a].prop === undefined) return;
            const propSchema = classSchema.schema.properties[defs[a].prop];
            if(propSchema === undefined) return;

            const op = {}

            const _def = (propSchema.type === 'String')?'distinct':'avg';
            
            op[defs[a].op || _def] = defs[a].prop;
            aggs[a] = op;
        })

        return aggs;
    },
    getAggregateValue:function(name) {
        if(!this._internal.aggregateValues) return;
        return this._internal.aggregateValues[name];
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if(name.startsWith('agg-')) this.registerOutput(name, {
        getter: this.getAggregateValue.bind(this, name.substring('agg-'.length))
      });
    },
    setVisualFilter: function (value) {
      this._internal.visualFilter = value;

      if (this.isInputConnected('storageFetch') === false) this.scheduleFetch();
    },
    setQueryParameter: function (name, value) {
      this._internal.queryParameters[name] = value;

      if (this.isInputConnected('storageFetch') === false) this.scheduleFetch();
    },
    setAggregateParameter:function(name,value) {
        const aggregates = this._internal.aggregates;
        if(name.startsWith('aggprop-')) {
            const _name = name.substring('aggprop-'.length);
            if(!aggregates[_name]) aggregates[_name] = {}
            aggregates[_name].prop = value;
        }
        else if(name.startsWith('aggop-')) {
            const _name = name.substring('aggop-'.length);
            if(!aggregates[_name]) aggregates[_name] = {}
            aggregates[_name].op = value;
        }
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('agg'))
      return this.registerInput(name, {
        set: this.setAggregateParameter.bind(this, name)
      });

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
        visualFilter: this.setVisualFilter.bind(this)
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

  ports.push({
    type: 'signal',
    plug: 'input',
    group: 'Actions',
    name: 'storageFetch',
    displayName: 'Do'
  });

  if(parameters['aggregates'] !== undefined && parameters.collectionName !== undefined) {
    var c = dbCollections && dbCollections.find((c) => c.name === parameters.collectionName);
      if (c === undefined && systemCollections) c = systemCollections.find((c) => c.name === parameters.collectionName);
      if (c && c.schema && c.schema.properties) {

        const aggs = parameters['aggregates'].split(',');

        const props = Object.keys(c.schema.properties).filter(k => c.schema.properties[k].type === 'Number' || c.schema.properties[k].type === 'String');

        aggs.forEach(a => {
            ports.push({
                index:101,
                name:'aggprop-'+a,
                plug:'input',
                type:{name:'enum',enums:props.map(k => ({value:k,label:k})),allowEditOnly:true},
                displayName:'Property',
                group:a
            });

            if(parameters['aggprop-'+a] !== undefined) {
                const prop = parameters['aggprop-'+a];
                const schema = c.schema.properties[prop];

                if(schema && schema.type === 'Number') {
                    // Number aggregate
                    ports.push({
                        index:102,
                        name: 'aggop-' + a,
                        plug: 'input',
                        type: {name:'enum', enums:[{value:'min',label:'Min'},
                                                    {value:'max',label:'Max'},
                                                    {value:'sum',label:'Sum'},
                                                    {value:'avg',label:'Avg'}],allowEditOnly:true},
                        default:'avg',
                        displayName: 'Operation',
                        group: a
                    })

                    ports.push({
                        name: 'agg-' + a,
                        plug: 'output',
                        type: 'number',
                        displayName: a,
                        group: 'Aggregates'
                    })
                }
                else if(schema && schema.type === 'String') {
                    // String aggregate
                    ports.push({
                        index:102,
                        name: 'aggop-' + a,
                        plug: 'input',
                        type: {name:'enum', enums:[{value:'distinct',label:'Distinct'}],allowEditOnly:true},
                        default:'distinct',
                        displayName: 'Operation',
                        group: a
                    })

                    ports.push({
                        name: 'agg-' + a,
                        plug: 'output',
                        type: 'string',
                        displayName: a,
                        group: 'Aggregates'
                    })
                }
            }

        })
    }
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
  node: AggregateNode,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      updatePorts(node.id, node.parameters, context.editorConnection, graphModel);

      node.on('parameterUpdated', function (event) {
        if (event.name.startsWith('storage') || event.name === 'visualFilter' || event.name === 'collectionName' || event.name.startsWith('agg')) {
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
      graphModel.on('nodeAdded.noodl.cloud.aggregate', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('noodl.cloud.aggregate')) {
        _managePortsForNode(node);
      }
    });
  }
};
