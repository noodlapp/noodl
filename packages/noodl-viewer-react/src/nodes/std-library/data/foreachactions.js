const { EdgeTriggeredInput } = require('@noodl/runtime');

const ForEachActionsDefinition = {
  name: 'For Each Actions',
  docs: 'https://docs.noodl.net/nodes/ui-controls/repeater-item',
  displayNodeName: 'Repeater Item',
  category: 'Data',
  color: 'data',
  inputs: {
    removeCompleted: {
      type: { name: 'boolean', allowConnectionsOnly: true },
      displayName: 'Remove Completed',
      group: 'Events',
      valueChangedToTrue: function () {
        this._internal.removeCompletedCallback && this._internal.removeCompletedCallback();
      }
    }
    /*   itemActions:{
        type:{name:'stringlist',allowEditOnly:true},
        group:'Actions',
        set:function(value) {
        }
      },
      itemActionParameters:{
        type:{name:'stringlist',allowEditOnly:true},
        group:'Action Parameters',
        set:function(value) {
        }
      }    */
  },
  outputs: {
    added: {
      type: 'signal',
      displayName: 'Added',
      group: 'Events'
    },
    tryRemove: {
      type: 'signal',
      displayName: 'Try Remove',
      group: 'Events'
    },
    itemId: {
      type: 'string',
      displayName: 'Item Id',
      group: 'General',
      get() {
        return this.getItemId();
      }
    }
  },
  prototypeExtensions: {
    getItemId() {
      const model = this.nodeScope.componentOwner._forEachModel;
      return model && model.getId();
    },
    signalAdded: function () {
      this.sendSignalOnOutput('added');
    },
    tryRemove: function (callback) {
      if (this.getOutput('tryRemove').hasConnections()) {
        this._internal.removeCompletedCallback = callback;
        this.sendSignalOnOutput('tryRemove');
      } else {
        // Schedule for later in this frame so any collection nodes
        // being delete can complete data persistence before being
        // deleted
        this.scheduleAfterInputsHaveUpdated(function () {
          callback();
        });
      }
    },
    itemActionTriggered(name) {
      this.scheduleAfterInputsHaveUpdated(() => {
        const itemId = this.getItemId();
        const parentForEach = this.nodeScope.componentOwner._forEachNode;
        parentForEach.signalItemAction(name, itemId, this._internal.actionParameters || {});
      });
    },
    setItemActionParameter(name) {
      if (!this._internal.actionParameters) this._internal.actionParameters = {};
      this._internal.actionParameters[name] = name;
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('itemAction-'))
        return this.registerInput(name, {
          set: EdgeTriggeredInput.createSetter({
            valueChangedToTrue: this.itemActionTriggered.bind(this, name)
          })
        });

      if (name.startsWith('itemActionParameter-'))
        return this.registerInput(name, {
          set: this.setItemActionParameter.bind(this, name)
        });
    }
  }
};

module.exports = {
  node: ForEachActionsDefinition,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    /*  graphModel.on("nodeAdded.For Each Actions", function (node) {
      function _updatePorts() {
        var ports = [];

        var actions = node.parameters['itemActions'];
        if(actions) {
          actions.split(',').forEach((a) => {
            ports.push({
              name:'itemAction-' + a,
              displayName:a,
              plug:'input',
              type:'signal',
              group:'Actions',
            })
          })
        }

        var parameters = node.parameters['itemActionParameters'];
        if(parameters) {
          parameters.split(',').forEach((p) => {
            ports.push({
              name:'itemActionParameter-' + p,
              displayName:p,
              plug:'input',
              type:'*',
              group:'Parameters',
            })
          })
        }

        context.editorConnection.sendDynamicPorts(node.id, ports);
      }

      _updatePorts();
      node.on('parameterUpdated',function(event) {
        if(event.name === 'itemActions' || event.name === 'itemActionParameters') _updatePorts();
      })

    })*/
  }
};
