"use strict";

var NodeModel = require('./nodemodel');
var EventSender = require('../eventsender');

function ComponentModel(name) {
    EventSender.call(this);

    this.name = name;
    this.nodes = [];
    this.connections = [];
    this.roots = [];
    this.inputPorts = {};
    this.outputPorts = {};
    this.metadata = {};
}

ComponentModel.prototype = Object.create(EventSender.prototype);

ComponentModel.prototype.addNode = async function(node) {
    node.component = this;
    this.nodes[node.id] = node;
    await this.emit("nodeAdded", node);
};

ComponentModel.prototype.hasNodeWithId = function(id) {
    return this.getNodeWithId(id) !== undefined;
};

ComponentModel.prototype.getNodeWithId = function(id) {
    return this.nodes[id];
};

ComponentModel.prototype.getAllNodes = function() {
    return Object.values(this.nodes);
};

ComponentModel.prototype.getNodesWithType = function(type) {
    var nodes = [];
    var self = this;
    Object.keys(this.nodes).forEach(function(id) {
        var node = self.nodes[id];
        if(node.type === type) {
            nodes.push(node);
        }
    });

    return nodes;
};

ComponentModel.prototype.addConnection = function(connection) {
    this.connections.push(connection);
    this.emit("connectionAdded", connection);
    
    //emit an event on the target node model
    //used by numbered inputs
    if(connection.targetId) {
        const node = this.getNodeWithId(connection.targetId);
        if(node) {
            node.emit("inputConnectionAdded", connection);
        }
    }
};

ComponentModel.prototype.removeConnection = function(connection) {
    const index = this.connections.findIndex(con => {
        return con.sourceId === connection.sourceId &&
               con.sourcePort === connection.sourcePort &&
               con.targetId === connection.targetId &&
               con.targetPort === connection.targetPort;
    });

    if(index === -1) {
       console.log("Connection doesn't exist", connection);
       return;
    }

    this.connections.splice(index, 1);
    this.emit("connectionRemoved", connection);

    //emit an event on the target node model
    //used by numbered inputs
    if(connection.targetId) {
        const node = this.getNodeWithId(connection.targetId);
        if(node) {
            node.emit("inputConnectionRemoved", connection);
        }
    }
};

ComponentModel.prototype.getConnectionsFromPort = function(nodeId, sourcePortName) {
    return this.connections.filter(function(connection) {
        return connection.sourceId === nodeId && connection.sourcePort === sourcePortName;
    })
};

ComponentModel.prototype.getConnectionsToPort = function(nodeId, targetPortName) {
    return this.connections.filter(function(connection) {
        return connection.targetId === nodeId && connection.targetPort === targetPortName;
    })
};

ComponentModel.prototype.getConnectionsFrom = function(nodeId) {
    return this.connections.filter(function(connection) {
        return connection.sourceId === nodeId;
    })
};

ComponentModel.prototype.getConnectionsTo = function(nodeId) {
    return this.connections.filter(function(connection) {
        return connection.targetId === nodeId;
    })
};

ComponentModel.prototype.addRootId = function(rootId) {
    if(this.roots.indexOf(rootId) !== -1) {
        return;
    }
    this.roots.push(rootId);
    this.emit("rootAdded", rootId);
};

ComponentModel.prototype.removeRootId = function(rootId) {
    const index = this.roots.indexOf(rootId);
    if(index !== -1) {
        this.roots.splice(index, 1);
        this.emit("rootRemoved", rootId);
    }
};

ComponentModel.prototype.getRoots = function() {
    return this.roots;
}

ComponentModel.prototype.removeNodeWithId = async function(id) {
    const node = this.getNodeWithId(id);

    if (!node) {
        console.warn("ERROR: Attempted to remove non-existing node with ID:", id);
        return false;
    }

    //remove children first
    while(node.children.length > 0) {
        const child = node.children[0];
        const childRemoved = await this.removeNodeWithId(child.id);
        if (!childRemoved) {
            // Workaround for corrupt node trees, should never happen, a remove should always be successful
            node.children.shift();
        }
    }

    const connections = this.getConnectionsTo(id).concat(this.getConnectionsFrom(id));

    for(let i=0; i<connections.length; i++) {
        this.removeConnection(connections[i]);
    }

    this.setNodeParent(node, null);

    if(this.roots.indexOf(node.id) !== -1) {
        this.removeRootId(node.id);
    }

    await this.emit("nodeRemoved", node);

    node.removeAllListeners();
    delete this.nodes[id];

    await this.emit("nodeWasRemoved", node);
    return true;
};

ComponentModel.prototype.getAllConnections = function() {
    return this.connections;
};

ComponentModel.prototype.getInputPorts = function() {
    return this.inputPorts;
};

ComponentModel.prototype.getOutputPorts = function() {
    return this.outputPorts;
};

ComponentModel.prototype.addInputPort = function(port) {
    this.inputPorts[port.name] = port;
    this.emit("inputPortAdded", port);
};

ComponentModel.prototype.addOutputPort = function(port) {
    this.outputPorts[port.name] = port;
    this.emit("outputPortAdded", port);
};

ComponentModel.prototype.removeOutputPortWithName = function(portName) {
    if(this.outputPorts.hasOwnProperty(portName)) {
        var port = this.outputPorts[portName];
        delete this.outputPorts[portName];
        this.emit("outputPortRemoved", port);
    }
};

ComponentModel.prototype.removeInputPortWithName = function(portName) {
    if(this.inputPorts.hasOwnProperty(portName)) {
        var port = this.inputPorts[portName];
        delete this.inputPorts[portName];
        this.emit("inputPortRemoved", port);
    }
};

ComponentModel.prototype.updateInputPortTypes = function(ports) {
    var changed = false;
    for(var key in ports) {
        if(this.inputPorts[key] !== undefined) {
            this.inputPorts[key].type = ports[key].type;
            changed = true;
        }
    }
    changed && this.emit("inputPortTypesUpdated");
}

ComponentModel.prototype.updateOutputPortTypes = function(ports) {
    var changed = false;
    for(var key in ports) {
        if(this.outputPorts[key] !== undefined) {
            this.outputPorts[key].type = ports[key].type;
            changed = true;
        }
    }
    changed && this.emit("outputPortTypesUpdated");
}

ComponentModel.prototype.renameInputPortOnNodeWithId = function(id, oldName, newName) {

    //remove connections
    var connections = this.getConnectionsToPort(id, oldName);
    connections.forEach(this.removeConnection.bind(this));

    //get port before deleting it
    var nodeModel = this.getNodeWithId(id);
    var port = {...nodeModel.getInputPort(oldName)};

    //remove old port
    if(port) {
        nodeModel.removeInputPortWithName(oldName);

        //rename and add new port
        port.name = newName;
        nodeModel.addInputPort(port);
    }

    //add new connection
    connections.forEach(function(connection) {
        connection.targetPort = newName;
    });

    connections.forEach(this.addConnection.bind(this));
};

ComponentModel.prototype.renameOutputPortOnNodeWithId = function(id, oldName, newName) {

    //remove connections
    var connections = this.getConnectionsFromPort(id, oldName);
    connections.forEach(this.removeConnection.bind(this));

    //get port before deleting it
    var nodeModel = this.getNodeWithId(id);
    var port = {...nodeModel.getOutputPort(oldName)};

    //remove old port
    nodeModel.removeOutputPortWithName(oldName);

    //rename and add new port
    port.name = newName;
    nodeModel.addOutputPort(port);

    //add new connection
    connections.forEach(function(connection) {
        connection.sourcePort = newName;
    });

    connections.forEach(this.addConnection.bind(this));
};

ComponentModel.prototype.setNodeParent = function(childModel, newParentModel, index) {

    if(this.roots.indexOf(childModel.id) !== -1) {
        this.removeRootId(childModel.id)
    }

    if(childModel.parent) {
        this.emit("nodeParentWillBeRemoved", childModel);
        childModel.parent.removeChild(childModel);
    }
    childModel.emit("parentUpdated", newParentModel);
    if(newParentModel) {
        newParentModel.addChild(childModel, index);
        this.emit("nodeParentUpdated", childModel);
    }
};

ComponentModel.prototype.importEditorNodeData = async function(nodeData, parentId, childIndex) {
    var nodeModel = NodeModel.createFromExportData(nodeData);
    await this.addNode(nodeModel);

    if(parentId) {
        this.setNodeParent(nodeModel, this.getNodeWithId(parentId), childIndex);
    }

    if(nodeData.children) {
        for(let i=0; i<nodeData.children.length; i++) {
            const child = nodeData.children[i];
            await this.importEditorNodeData(child, nodeModel.id, i);
        }
    }
};

ComponentModel.prototype.reset = async function() {
    while(this.roots.length) {
        await this.removeNodeWithId(this.roots[0]);
    }

    for(const id of this.nodes) {
        //note: with an incomplete library there will be no roots
        //so some of the nodes will have children, which will be recursively removed by
        //removeNodeWithId(), so some IDs from the Object.keys(this.nodes) that runs this loop
        //will already have been removed, so check if they exist before removing
        if(this.hasNodeWithId(id)) {
            await this.removeNodeWithId(id);
        }
    }

    if(this.nodes.length > 0) {
        throw new Error("Not all nodes were removed during a reset");
    }

    if(this.connections.length > 0) {
        throw new Error("Not all connections were removed during a reset");
    }
};

ComponentModel.prototype.rename = function(newName) {
    var oldName = this.name;
    this.name = newName;
    this.emit("renamed", {oldName: oldName, newName: newName});
};

ComponentModel.prototype.setMetadata = function(key, data) {
    this.metadata[key] = data;
};

ComponentModel.prototype.getMetadata = function(key) {
    if(!key) return this.metadata;
    return this.metadata[key];
};

ComponentModel.createFromExportData = async function(componentData) {

    var componentModel = new ComponentModel(componentData.name);

    if(componentData.metadata) {
        for(const key in componentData.metadata) {
            componentModel.setMetadata(key, componentData.metadata[key]);
        }
    }

    componentData.ports && componentData.ports.forEach(function(port) {
        if(port.plug === "input" || port.plug === "input/output") {
            componentModel.addInputPort(port);
        }
        if(port.plug === "output" || port.plug === "input/output") {
            componentModel.addOutputPort(port);
        }
    });

    if(componentData.nodes) {
        for(const node of componentData.nodes) {
            await componentModel.importEditorNodeData(node);
        }
    }

    componentData.connections && componentData.connections.forEach(connection => componentModel.addConnection(connection));
    componentData.roots && componentData.roots.forEach(root => componentModel.addRootId(root));

    return componentModel;
};

module.exports = ComponentModel;
