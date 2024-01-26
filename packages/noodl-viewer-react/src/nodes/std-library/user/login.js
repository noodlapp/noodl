'use strict';

const { Node, EdgeTriggeredInput } = require('@noodl/runtime');
const UserService = require('./userservice');

var LoginNodeDefinition = {
  name: 'net.noodl.user.LogIn',
  docs: 'https://docs.noodl.net/nodes/data/user/log-in',
  displayNodeName: 'Log In',
  category: 'Cloud Services',
  color: 'data',
  initialize: function () {
    var internal = this._internal;
  },
  getInspectInfo() {},
  outputs: {
    success: {
      type: 'signal',
      displayName: 'Success',
      group: 'Events'
    },
    failure: {
      type: 'signal',
      displayName: 'Failure',
      group: 'Events'
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
  inputs: {
    login: {
      displayName: 'Do',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleLogIn();
      }
    },
    username: {
      displayName: 'Username',
      type: 'string',
      group: 'General',
      set: function (value) {
        this._internal.username = value;
      }
    },
    password: {
      displayName: 'Password',
      type: 'string',
      group: 'General',
      set: function (value) {
        this._internal.password = value;
      }
    }
  },
  methods: {
    setError: function (err) {
      this._internal.error = err;
      this.flagOutputDirty('error');
      this.sendSignalOnOutput('failure');

      if (this.context.editorConnection) {
        this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'user-login-warning', {
          message: err,
          showGlobally: true
        });
      }
    },
    clearWarnings() {
      if (this.context.editorConnection) {
        this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'user-login-warning');
      }
    },
    scheduleLogIn: function () {
      const internal = this._internal;

      if (this.logInScheduled === true) return;
      this.logInScheduled = true;

      this.scheduleAfterInputsHaveUpdated(() => {
        this.logInScheduled = false;

        UserService.instance.logIn({
          username: this._internal.username,
          password: this._internal.password,
          success: () => {
            this.sendSignalOnOutput('success');
          },
          error: (e) => {
            this.setError(e);
          }
        });
      });
    }
  }
};

/*function updatePorts(nodeId, parameters, editorConnection, dbCollections) {
    var ports = [];

    ports.push({
        name: 'collectionName',
        displayName: "Class",
        group: "General",
        type: { name: 'enum', enums: (dbCollections !== undefined) ? dbCollections.map((c) => { return { value: c.name, label: c.name } }) : [], allowEditOnly: true },
        plug: 'input'
    })

    if (parameters.collectionName && dbCollections) {
        // Fetch ports from collection keys
        var c = dbCollections.find((c) => c.name === parameters.collectionName);
        if (c && c.schema && c.schema.properties) {
            var props = c.schema.properties;
            for (var key in props) {
                var p = props[key];
                if (ports.find((_p) => _p.name === key)) continue;

                if(p.type === 'Relation') { 
                    
                }
                else { // Other schema type ports
                    const _typeMap = {
                        "String":"string",
                        "Boolean":"boolean",
                        "Number":"number",
                        "Date":"date"
                    }

                    ports.push({
                        type: {
                            name: _typeMap[p.type]?_typeMap[p.type]:'*',
                        },
                        plug: 'output',
                        group: 'Properties',
                        name: 'prop-' + key,
                        displayName: key,
                    })

                    ports.push({
                        type: 'signal',
                        plug: 'output',
                        group: 'Changed Events',
                        displayName: key+ ' Changed',
                        name: 'changed-' + key,
                    })
                }
            }
        }
    }

     editorConnection.sendDynamicPorts(nodeId, ports);
}*/

module.exports = {
  node: LoginNodeDefinition,
  setup: function (context, graphModel) {
    /* if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
            return;
        }

        function _managePortsForNode(node) {
            updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('dbCollections'));

            node.on("parameterUpdated", function (event) {
                updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('dbCollections'));
            });

            graphModel.on('metadataChanged.dbCollections', function (data) {
                updatePorts(node.id, node.parameters, context.editorConnection, data);
            })
        }

        graphModel.on("editorImportComplete", ()=> {
            graphModel.on("nodeAdded.DbModel2", function (node) {
				_managePortsForNode(node)
			})

			for(const node of graphModel.getNodesWithType('DbModel2')) {
				_managePortsForNode(node)
			}
        })*/
  }
};
