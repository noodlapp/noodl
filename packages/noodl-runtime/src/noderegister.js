"use strict";

function NodeRegister(context) {
    this._constructors = {};
    this.context = context;
}

NodeRegister.prototype.register = function(nodeDefinition) {
    var name = nodeDefinition.metadata.name;

    this._constructors[name] = nodeDefinition;
};

NodeRegister.prototype.createNode = function(name, id, nodeScope) {
    if(this._constructors.hasOwnProperty(name) === false) {
        throw new Error("Unknown node type with name " + name);
    }

    return this._constructors[name](this.context, id, nodeScope);
};

NodeRegister.prototype.getNodeMetadata = function(type) {
    if(this._constructors.hasOwnProperty(type) === false) {
        throw new Error("Unknown node type with name " + type);
    }

    return this._constructors[type].metadata;
};

NodeRegister.prototype.hasNode = function(type) {
    return this._constructors.hasOwnProperty(type);
};

NodeRegister.prototype.getInputType = function(type, inputName) {
    const metadata = this.getNodeMetadata(type);
    return metadata.inputs[inputName] && metadata.inputs[inputName].type;
}

module.exports = NodeRegister;