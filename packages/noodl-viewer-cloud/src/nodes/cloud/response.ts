export const node = {
  name: 'noodl.cloud.response',
  displayNodeName: 'Response',
  category: 'Cloud',
  docs: 'https://docs.noodl.net/nodes/cloud-functions/response',
  useVariants: false,
  mountedInput: false,
  allowAsExportRoot: false,
  color: "data",
  connectionPanel: {
    groupPriority: ['General', 'Mounted']
  },
  dynamicports:[
    {
        name:'conditionalports/extended',
        condition:"status = success OR status NOT SET",
        inputs:['params']
    },
    {
      name:'conditionalports/extended',
      condition:"status = failure",
      inputs:['errorMessage']
    }
  ],
  initialize:function() {
    this._internal.responseParameters = {}
  },
  inputs: {
    params: {
      group: 'Parameters',
      type:{name:'stringlist',allowEditOnly:true},
      set: function (value) {
        this._internal.params = value;
      }
    },
    errorMessage: {
      group: 'General',
      type: 'string',
      displayName:'Error Message',
      set: function (value) {
        this._internal.errorMessage = value;
      }
    },
    send: {
      displayName: 'Send',
      type: 'signal',
      group: 'General',
      valueChangedToTrue: function () {
        if(this._internal.status === undefined || this._internal.status === 'success') {
          this._internal._sendResponseCallback({
            statusCode: 200,
            body: JSON.stringify({result:this._internal.responseParameters})
          })
        }
        else {
          this._internal._sendResponseCallback({
            statusCode: 400,
            body: JSON.stringify({error:this._internal.errorMessage})
          })
        }
      }
    },
    status: {
      group: 'General',
      displayName:'Status',
      type: {
        name: 'enum',
        enums: [
          {
            label: 'Success',
            value: 'success'
          },
          {
            label: 'Failure',
            value: 'failure'
          }
        ]
      },
      default:'success',
      set: function(value) {
        this._internal.status = value;
      }
    }
  },
  methods:{
    setResponseParameter:function(name,value) {
      this._internal.responseParameters[name] = value
    },
    registerInputIfNeeded: function(name) {
      if(this.hasInput(name)) {
          return;
      }

      if(name.startsWith('pm-')) this.registerInput(name, {
          set: this.setResponseParameter.bind(this, name.substring('pm-'.length))
      })
    },
  }
};

export function setup(context, graphModel) {
  if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
    return;
  }

  function _managePortsForNode(node) {
    function _updatePorts() {
      var ports = []

      // Add params outputs
      if(node.parameters.status === 'success' || node.parameters.status === undefined) {
        var params = node.parameters.params;
        if (params !== undefined) {
          params = params.split(',');
          for (var i in params) {
            var p = params[i];

            ports.push({
              type: '*',
              plug: 'input',
              group: 'Parameters',
              name: 'pm-' + p,
              displayName: p
            })
          }
        }
      }

      context.editorConnection.sendDynamicPorts(node.id, ports);
    }

    _updatePorts();
    node.on("parameterUpdated", function (event) {
      if (event.name === 'params') {
        _updatePorts();
      }
    });
  }

  graphModel.on("editorImportComplete", () => {
    graphModel.on("nodeAdded.noodl.cloud.response", function (node) {
      _managePortsForNode(node)
    })

    for (const node of graphModel.getNodesWithType('noodl.cloud.response')) {
      _managePortsForNode(node)
    }
  })
}
