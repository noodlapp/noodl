"use strict";

function difference(array1, array2) {
    const valueSet = new Set(array2);
    return array1.filter(e => !valueSet.has(e));
}

async function handleEvent(context, graphModel, event) {

    function applyPortDelta(nodeModel, newPorts) {
        var inputPorts = {};
        var outputPorts = {};

        newPorts.forEach(function(port) {
            //some ports are incorrectly named outputs instead of output, patch it here so
            //the rest of the code doesn't need to care
            if(port && port.plug === "outputs") {
              port.plug = "output";
            }

            if(port.plug === 'input' || port.plug === 'input/output') {
                inputPorts[port.name] = port;
            }
            if(port.plug === 'output' || port.plug === 'input/output') {
                outputPorts[port.name] = port;
            }
        });

        var existingInputs = Object.keys(nodeModel.getInputPorts());

        var inputPortsToRemove = difference(existingInputs, Object.keys(inputPorts));
        var inputPortsToAdd = difference(Object.keys(inputPorts), existingInputs);
        
        // Update port types if it has changed
        nodeModel.updateInputPortTypes(inputPorts);

        // Remove and add input ports
        inputPortsToRemove.forEach(nodeModel.removeInputPortWithName.bind(nodeModel));
        inputPortsToAdd.forEach(function(portName) {
            nodeModel.addInputPort(inputPorts[portName]);
            if(nodeModel.parameters && nodeModel.parameters.hasOwnProperty(portName)) {
                setInputValueOnNodeInstancesWithModel(context.rootComponent.nodeScope, nodeModel, portName, nodeModel.parameters[portName]);
            }
        });

        // Update port types if it has changed
        nodeModel.updateOutputPortTypes(outputPorts);

        // Remove and add output ports
        var existingOutputs = Object.keys(nodeModel.getOutputPorts());

        var outputPortsToRemove = difference(existingOutputs, Object.keys(outputPorts));
        var outputPortsToAdd = difference(Object.keys(outputPorts), existingOutputs);

        outputPortsToRemove.forEach(nodeModel.removeOutputPortWithName.bind(nodeModel));
        outputPortsToAdd.forEach(function(portName) {
            nodeModel.addOutputPort(outputPorts[portName]);
        });
    }

    function setInputValueOnNodeInstancesWithModel(nodeScope, nodeModel, port, value) {
        var nodes = nodeScope.getNodesWithIdRecursive(nodeModel.id);
        nodes.forEach(function(node) {
            node.queueInput(port, value);
        });
    }

    var componentModel;
    if(event.componentName) {
        componentModel = graphModel.getComponentWithName(event.componentName);
        if(!componentModel) {
            //if we haven't received this component yet, just ignore the delta update
            return;
        }
    }

    //some ports are incorrectly named outputs instead of output, patch it here so
    //the rest of the code doesn't need to care
    if(event.port && event.port.plug === "outputs") {
        event.port.plug = "output";
    }

    var eventHandlers = {
        nodeAdded: function(event) {
            componentModel.importEditorNodeData(event.model, event.parentId, event.childIndex);
        },
        nodeRemoved: async function(event) {
            if(componentModel.hasNodeWithId(event.model.id)) {
                await componentModel.removeNodeWithId(event.model.id);
            }
        },
        connectionAdded: function(event) {
            componentModel.addConnection(event.model);
        },
        connectionRemoved: function(event) {
            componentModel.removeConnection(event.model);

            //revert to default value or parameter if this was the last connection to that port
            var targetNodeModel = componentModel.getNodeWithId(event.model.targetId);
            if(componentModel.getConnectionsToPort(targetNodeModel.id, event.model.targetId).length === 0) {
                var value = targetNodeModel.parameters[event.model.targetPort];
                if(value === undefined) {
                    value = context.getDefaultValueForInput(targetNodeModel.type, event.model.targetPort);
                }

                setInputValueOnNodeInstancesWithModel(context.rootComponent.nodeScope, targetNodeModel, event.model.targetPort, value);
            }

        },
        parameterChanged: function(event) {

            const nodeModel = componentModel.getNodeWithId(event.nodeId);
            if(nodeModel === undefined) {
                console.log("parameterChanged: Unknown node id",event);
                return;
            }

            //did we get a bunch of parameters at once?
            if(event.parameters) {
                //note: some props might be deleted, then they only exist in oldParameters
                const allParams = new Set(Object.keys(event.parameters).concat(Object.keys(event.oldParameters)));
                for(const param of allParams) {
                    nodeModel.setParameter(param, event.parameters[param]);
                }
            }
            
            //did we get a single parameters?
            if(event.parameterName) {
                nodeModel.setParameter(event.parameterName, event.parameterValue, event.state);
            }
        },
        nodeAttached: function(event) {
            componentModel.setNodeParent(componentModel.getNodeWithId(event.nodeId), componentModel.getNodeWithId(event.parentId), event.childIndex);
        },
        nodeDetached: function(event) {
            componentModel.setNodeParent(componentModel.getNodeWithId(event.nodeId), null);
            componentModel.addRootId(event.nodeId);
        },
        componentAdded: function(event) {
            graphModel.importComponentFromEditorData(event.model);
        },
        componentRemoved: async function(event) {
            await graphModel.removeComponentWithName(event.componentName);
        },
        rootAdded: function(event) {
            componentModel.addRootId(event.nodeId);
        },
        portAdded: function(event) {
            var nodeModel = componentModel.getNodeWithId(event.nodeId);
            if(event.port.plug === "input" || event.port.plug === "input/output") {
                nodeModel.addInputPort(event.port);

                //if node already has an old value for this port, set that value on all instances of the node
                //example: expression a+b, a=1, b=2. User removes b and then adds it again, the value 2 should be restored since it's still in the model
                if(nodeModel.parameters.hasOwnProperty(event.port)) {
                    setInputValueOnNodeInstancesWithModel(context.rootComponent.nodeScope, nodeModel, event.port, nodeModel.parameters[event.port]);
                }
            }
            if(event.port.plug === "output" || event.port.plug === "input/output") {
                nodeModel.addOutputPort(event.port);
            }
        },
        portRemoved: function(event) {
            var nodeModel = componentModel.getNodeWithId(event.nodeId);
            if(event.port.plug === "input" || event.port.plug === "input/output") {
                nodeModel.removeInputPortWithName(event.port.name);
            }
            if(event.port.plug === "output" || event.port.plug === "input/output") {
                nodeModel.removeOutputPortWithName(event.port.name);
            }
        },
        nodePortRenamed: function(event) {
            if(event.port.plug === "input" || event.port.plug === "input/output") {
                componentModel.renameInputPortOnNodeWithId(event.nodeId, event.oldName, event.port.name);
            }
            if(event.port.plug === "output" || event.port.plug === "input/output") {
                componentModel.renameOutputPortOnNodeWithId(event.nodeId, event.oldName, event.port.name);
            }
            var node = componentModel.getNodeWithId(event.nodeId);
            if(node.type === "Component Inputs") {
                componentModel.addInputPort(event.port);
                graphModel.getNodesWithType(componentModel.name).forEach(function(componentInstance) {
                    componentInstance.component.renameInputPortOnNodeWithId(componentInstance.id, event.oldName, event.port.name);
                });
                componentModel.removeInputPortWithName(event.oldName);
            }
            else if(node.type === "Component Outputs") {
                componentModel.addOutputPort(event.port);
                graphModel.getNodesWithType(componentModel.name).forEach(function(componentInstance) {
                    componentInstance.component.renameOutputPortOnNodeWithId(componentInstance.id, event.oldName, event.port.name);
                });
                componentModel.removeOutputPortWithName(event.oldName);
            }
        },
        componentPortsUpdated: function(event) {
            applyPortDelta(componentModel, event.ports);
        },
        instancePortsChanged: function(event) {
            if(!componentModel.hasNodeWithId(event.nodeId)) return;
            var nodeModel = componentModel.getNodeWithId(event.nodeId);
            applyPortDelta(nodeModel, event.ports);
        },
        componentRenamed: function(event) {
            graphModel.renameComponent(event.oldName, event.newName);
        },
        settingsChanged: function(event) {
            graphModel.setSettings(event.settings);
        },
        metadataChanged: function(event) {
            graphModel.setMetaData(event.key,event.data);
        },
        componentMetadataChanged: function(event) {
            const c = graphModel.getComponentWithName(event.componentName);
            if(!c) return;
            c.setMetadata(event.key, event.data);
        },
        variantParametersChanged: function(event) {
            if(event.variant) {
                //we got the whole variant
                graphModel.updateVariant(event.variant);
            }
            else {
                //we got a specific value to update
                graphModel.updateVariantParameter(event.variantName, event.variantTypeName, event.parameterName, event.parameterValue, event.state);

                //check if value has been deleted from the variant
                if(event.parameterValue === undefined) {
                    //all active nodes with this variant will have to revert back to the default value, if they don't have local overrides
                    const variant = graphModel.getVariant(event.variantTypeName, event.variantName);
                    const nodes = context.rootComponent.nodeScope.getAllNodesWithVariantRecursive(variant);
                    nodes.forEach(node => {
                        node.queueInput(event.parameterName, node.getParameter(event.parameterName));
                    });
                }
            }
        },
        variantDeleted: function(event) {
            graphModel.deleteVariant(event.variantTypeName, event.variantName);
        },
        variantChanged: function(event) {
            const nodeModel = componentModel.getNodeWithId(event.nodeId);
            const variant = graphModel.getVariant(nodeModel.type, event.variantName);

            nodeModel.setVariant(variant);
        },
        variantRenamed: function(event) {
            const variant = graphModel.getVariant(event.variantTypeName, event.oldVariantName);
            if(variant) {
                variant.name = variant.variantName;
            }
        },
        defaultStateTransitionChanged: function(event) {
            const nodeModel = componentModel.getNodeWithId(event.nodeId);
            nodeModel.setDefaultStateTransition(event.curve, event.state);
        },
        stateTransitionsChanged: function(event) {
            const nodeModel = componentModel.getNodeWithId(event.nodeId);
            if(event.parameterName) {
                nodeModel.setStateTransitionParamter(event.parameterName, event.curve, event.state);
            }            
        },
        variantDefaultStateTransitionChanged: function(event) {
            graphModel.updateVariantDefaultStateTransition(event.variantName, event.variantTypeName, event.curve, event.state);
        },
        variantStateTransitionsChanged: function(event) {
            graphModel.updateVariantStateTransition(event);
        },
        routerIndexChanged: function(event) {
            graphModel.routerIndex = event.data;
        }
    };

    if(eventHandlers.hasOwnProperty(event.type)) {
        await eventHandlers[event.type](event);
        context.scheduleUpdate();
    }
    else {
        console.log('Unknown event', event);
    }
}

module.exports = {
    handleEvent: handleEvent
};
