'use strict';

const PageInputsNode = {
  name: 'PageInputs',
  displayNodeName: 'Page Inputs',
  category: 'Navigation',
  docs: 'https://docs.noodl.net/nodes/navigation/page-inputs',
  color: 'component',
  initialize: function () {
    var internal = this._internal;

    internal.params = {};
  },
  inputs: {
    pathParams: {
      type: { name: 'stringlist', allowEditOnly: true },
      group: 'Path Parameters'
    },
    queryParams: {
      type: { name: 'stringlist', allowEditOnly: true },
      group: 'Query Parameters'
    }
  },
  outputs: {},
  methods: {
    _setPageParams: function (params) {
      for (var key in params) {
        this._internal.params[key] = params[key];
        if (this.hasOutput('pm-' + key)) this.flagOutputDirty('pm-' + key);
      }
    },
    getPageParam: function (name) {
      return this._internal.params[name];
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name.startsWith('pm-'))
        return this.registerOutput(name, {
          getter: this.getPageParam.bind(this, name.substring('pm-'.length))
        });
    }
  }
};

module.exports = {
  node: PageInputsNode
  /*  setup: function setup(context, graphModel) {
        if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
            return;
        }
    
        function _managePortsForNode(node) {
            function _updatePorts() {
                var ports = []

                const uniqueNames = {}

                if(node.parameters['pathParams'] !== undefined) {
                    node.parameters['pathParams'].split(',').forEach((p) => {
                        uniqueNames[p] = true
                    }) 
                }

                if(node.parameters['queryParams'] !== undefined) {
                    node.parameters['queryParams'].split(',').forEach((p) => {
                        uniqueNames[p] = true
                    }) 
                }

                Object.keys(uniqueNames).forEach((outputName) => {
                    ports.push({
                        name: 'pm-' + outputName,
                        displayName: outputName,
                        type: '*',
                        plug: 'output',
                        group: 'Parameters'
                    })
                })

                context.editorConnection.sendDynamicPorts(node.id, ports);
            }

            // Track page node in this component, update if there are any changes
            _updatePorts();
            node.on("parameterUpdated", function (event) {
                _updatePorts();
            })
        }
        
        graphModel.on("editorImportComplete", ()=> {
            graphModel.on("nodeAdded.PageInputs", function (node) {
                _managePortsForNode(node)
            })
    
            for(const node of graphModel.getNodesWithType('PageInputs')) {
                _managePortsForNode(node)
            }
        })
    }*/
};
