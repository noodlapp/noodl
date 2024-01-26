"use strict";

var EventSender = require('../eventsender');

function NodeModel(id, type) {
    EventSender.call(this);

    this.id = id;
    this.type = type;

    this.inputs = [];
    this.outputs = [];
    this.children = [];
    this.parameters = {};
    this.inputPorts = {};
    this.outputPorts = {};
}

NodeModel.prototype = Object.create(EventSender.prototype);

NodeModel.prototype.setParameter = function(name, value, state) {
    if(state) {
        if(!this.stateParameters) this.stateParameters = {};
        if(!this.stateParameters[state]) this.stateParameters[state] = {};

        if(value === undefined) {
            delete this.stateParameters[state][name];
        }
        else {
            this.stateParameters[state][name] = value;
        }
    }
    else {
        if(value === undefined) {
            delete this.parameters[name];
        }
        else {
            this.parameters[name] = value;
        }
    }

    this.emit("parameterUpdated", {name, value, state});
};

NodeModel.prototype.setParameters = function(parameters) {
    Object.keys(parameters).forEach(name => {
        this.setParameter(name, parameters[name]);
    });
};

NodeModel.prototype.setStateParameters = function(parameters) {
   this.stateParameters = parameters;
};

NodeModel.prototype.setStateTransitions = function(stateTransitions) {
    this.stateTransitions = stateTransitions;
};

NodeModel.prototype.setStateTransitionParamter = function(parameter, curve, state) {
    if(!this.stateTransitions) {
        this.stateTransitions = {};
    }

    if(curve) {
        this.stateTransitions[state][parameter] = curve;
    }
    else {
        delete this.stateTransitions[state][parameter];
    }
};

NodeModel.prototype.setDefaultStateTransition = function(stateTransition, state) {
    if(!this.defaultStateTransitions) {
        this.defaultStateTransitions = {};
    }
    this.defaultStateTransitions[state] = stateTransition;
};

NodeModel.prototype.addInputPort = function(port) {
    this.inputPorts[port.name] = port;
    this.emit("inputPortAdded", port);
};

NodeModel.prototype.getInputPort = function(portName) {
    return this.inputPorts[portName];
};

NodeModel.prototype.getInputPorts = function() {
    return this.inputPorts;
};

NodeModel.prototype.removeInputPortWithName = function(portName) {
    if(this.inputPorts.hasOwnProperty(portName)) {
        var port = this.inputPorts[portName];
        delete this.inputPorts[portName];
        this.emit("inputPortRemoved", port);
    }
};

NodeModel.prototype.updateInputPortTypes = function(ports) {
    var changed = false;
    for(var key in ports) {
        if(this.inputPorts[key] !== undefined) {
            this.inputPorts[key].type = ports[key].type;
            changed = true;
        }
    }
    changed && this.emit("inputPortTypesUpdated");
}

NodeModel.prototype.addOutputPort = function(port) {
    this.outputPorts[port.name] = port;
    this.emit("outputPortAdded", port);
};

NodeModel.prototype.getOutputPort = function(portName) {
    return this.outputPorts[portName];
};

NodeModel.prototype.getOutputPorts = function() {
    return this.outputPorts;
};

NodeModel.prototype.removeOutputPortWithName = function(portName) {
    if(this.outputPorts.hasOwnProperty(portName)) {
        var port = this.outputPorts[portName];
        delete this.outputPorts[portName];
        this.emit("outputPortRemoved", port);
    }
};

NodeModel.prototype.updateOutputPortTypes = function(ports) {
    var changed = false;
    for(var key in ports) {
        if(this.outputPorts[key] !== undefined) {
            this.outputPorts[key].type = ports[key].type;
            changed = true;
        }
    }
    changed && this.emit("outputPortTypesUpdated");
}

NodeModel.prototype.addChild = function(child, index) {
    child.parent = this;
    if(index === undefined) {
        this.children.push(child);
    }
    else {
        this.children.splice(index, 0, child);
    }
    this.emit("childAdded", child);
};

NodeModel.prototype.removeChild = function(child) {
    child.parent = undefined;
    var index = this.children.indexOf(child);
    this.children.splice(index, 1);
    this.emit("childRemoved", child);
};

NodeModel.prototype.reset = function() {
    this.removeAllListeners();
};

NodeModel.prototype.setVariant = function(variant) {
    this.variant = variant;
    this.emit("variantUpdated", variant);
};

NodeModel.createFromExportData = function(nodeData) {
    var node = new NodeModel(nodeData.id, nodeData.type);
    nodeData.parameters && node.setParameters(nodeData.parameters);
    nodeData.stateParameters && node.setStateParameters(nodeData.stateParameters);
    nodeData.stateTransitions && node.setStateTransitions(nodeData.stateTransitions);
    
    if(nodeData.defaultStateTransitions) {
        for(const state in nodeData.defaultStateTransitions) {
            node.setDefaultStateTransition(nodeData.defaultStateTransitions[state], state);
        }
    }
    
    nodeData.ports && nodeData.ports.forEach(function(port) {

        //some ports are incorrectly named outputs instead of output, patch it here so
        //the rest of the code doesn't need to care
        if(port.plug === "outputs") {
          port.plug = "output";
        }

        if(port.plug === "input" || port.plug === "input/output") {
            node.addInputPort(port);
        }
        if(port.plug === "output" || port.plug === "input/output") {
            node.addOutputPort(port);
        }
    });

    nodeData.variant && node.setVariant(nodeData.variant);

    return node;
};

module.exports = NodeModel;