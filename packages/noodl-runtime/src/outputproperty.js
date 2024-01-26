"use strict";

/**
 * @class OutputProperty
 *
 * @param args Arguments
 * @param {Function} args.getter Function that returns the value
 * @param {Node} args.owner Port owner
 * @param {string} args.type Output value type
 * @constructor
 */
function OutputProperty(args) {

    if(!args.owner) {
        throw new Error("Owner must be set");
    }
    this.getter = args.getter;
    this.connections = [];
    this.owner = args.owner;
    this.name = args.name;
    this.onFirstConnectionAdded = args.onFirstConnectionAdded;
    this.onLastConnectionRemoved = args.onLastConnectionRemoved;

    this._id = undefined;
}

Object.defineProperties(OutputProperty.prototype, {
    /**
     * Gets the current value
     * @name OutputProperty#value
     * @readonly
     */
    value: {
        get: function() {
            return this.getter.call(this.owner);
        }
    },

    id: {
        get: function() {
            if(!this._id) {
                this._id = this.owner.id + this.name;
            }
            return this._id;
        }
    },

    /**
     * Registers a connection to propagate dirtiness
     * Also records which input port it's connected to so nodes like
     * Animation can set it's implicit start value
     * @name OutputProperty#registerConnection
     * @readonly
     */
    registerConnection: {
        value: function(node, inputPortName) {
            this.connections.push({
                node: node,
                inputPortName: inputPortName
            });

            if(this.connections.length === 1 && this.onFirstConnectionAdded) {
                this.onFirstConnectionAdded.call(this.owner);
            }
        }
    },

    /**
     * Deregisters a connection to a specific input port
     * @name OutputProperty#deregisterConnection
     * @readonly
     */
    deregisterConnection: {
        value: function(node, inputPortName) {
            for(var i=0; i<this.connections.length; i++) {
                var connection = this.connections[i];
                if(connection.node === node && connection.inputPortName === inputPortName) {
                    this.connections.splice(i,1);
                    break;
                }
            }

            if(this.connections.length === 0 && this.onLastConnectionRemoved) {
                this.onLastConnectionRemoved.call(this.owner);
            }
        }
    },

    /**
     * Sets dirty flag of all nodes that depend on this output port
     * @name OutputProperty#flagDependeesDirty
     * @readonly
     */
    flagDependeesDirty: {
        value: function(value) {
            for(var i= 0, len=this.connections.length; i<len; i++) {
                this.connections[i].node.flagDirty();
            }
        }
    },
    sendValue: {
        value: function(value) {
            if(this._lastUpdateIteration !== this.owner._updatedAtIteration) {
                this._lastUpdateIteration = this.owner._updatedAtIteration;
                this.valuesSendThisIteration = 0;
            }
            else {
                this.valuesSendThisIteration++;
            }

            if(this.valuesSendThisIteration > 500) {
                //this will make the owner send a warning and stop its update
                this.owner._cyclicLoop = true;
            }

            for(var i= 0, len=this.connections.length; i<len; i++) {
                var connection = this.connections[i];
                connection.node._setValueFromConnection(connection.inputPortName, value);
            }
        }
    },
    /**
     * @name OutputProperty#hasConnections
     * @readonly
     */
    hasConnections: {
        value: function() {
            return this.connections.length > 0;
        }
    }
});
module.exports = OutputProperty;