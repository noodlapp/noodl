'use strict';

var ComponentModel = require('./componentmodel');
var EventSender = require('../eventsender');

function GraphModel() {
  EventSender.call(this);
  this.components = {};

  this.settings = {};

  this.metadata = {};
}

GraphModel.prototype = Object.create(EventSender.prototype);

GraphModel.prototype.importComponentFromEditorData = async function (componentData) {
  var componentModel = await ComponentModel.createFromExportData(componentData);
  this.addComponent(componentModel);
};

GraphModel.prototype.getBundleContainingComponent = function (name) {
  return this.componentToBundleMap.get(name);
};

GraphModel.prototype.getBundlesContainingSheet = function (sheetName) {
  const bundles = new Set();
  for (const name of this.componentToBundleMap.keys()) {
    const isOnDefaultSheet = name.indexOf('/#') !== 0;

    const isMatch =
      (isOnDefaultSheet && sheetName === 'Default') || (!isOnDefaultSheet && name.indexOf('/#' + sheetName) === 0);

    if (isMatch) {
      bundles.add(this.componentToBundleMap.get(name));
    }
  }
  return Array.from(bundles);
};

GraphModel.prototype.getBundleDependencies = function (bundleName) {
  const result = new Set();

  const recurse = (name) => {
    const bundle = this.componentIndex[name];
    for (const dep of bundle.dependencies) {
      if (!result.has(dep)) {
        result.add(dep);
        recurse(dep);
      }
    }
  };

  recurse(bundleName);

  return Array.from(result);
};

GraphModel.prototype.importEditorData = async function (exportData) {
  this.componentIndex = exportData.componentIndex;
  this.routerIndex = exportData.routerIndex;

  this.componentToBundleMap = new Map();

  for (const bundleName in exportData.componentIndex) {
    const bundle = exportData.componentIndex[bundleName];

    for (const componentName of bundle.components) {
      this.componentToBundleMap.set(componentName, bundleName);
    }
  }

  this.variants = exportData.variants || [];

  exportData.settings && this.setSettings(exportData.settings);

  exportData.metadata && this.setAllMetaData(exportData.metadata);

  for (const component of exportData.components) {
    await this.importComponentFromEditorData(component);
  }

  this.setRootComponentName(exportData.rootComponent);
};

GraphModel.prototype.setRootComponentName = function (componentName) {
  this.rootComponent = componentName;
  this.emit('rootComponentNameUpdated', componentName);
};

GraphModel.prototype.getNodesWithType = function (type) {
  var nodes = [];

  var componentNames = Object.keys(this.components);
  for (var i = 0; i < componentNames.length; i++) {
    var component = this.components[componentNames[i]];
    nodes = nodes.concat(component.getNodesWithType(type));
  }
  return nodes;
};

GraphModel.prototype.getComponentWithName = function (type) {
  return this.components[type];
};

GraphModel.prototype.hasComponentWithName = function (type) {
  return this.components[type] ? true : false;
};

GraphModel.prototype.getAllComponents = function () {
  return Object.keys(this.components).map((name) => {
    return this.components[name];
  });
};

GraphModel.prototype.getAllNodes = function () {
  var nodes = [];

  var componentNames = Object.keys(this.components);
  for (var i = 0; i < componentNames.length; i++) {
    var component = this.components[componentNames[i]];
    nodes = nodes.concat(component.getAllNodes());
  }

  return nodes;
};

GraphModel.prototype.addComponent = function (component) {
  this.components[component.name] = component;

  //nodes that are already added are missing component input/output ports if the component is registered after the nodes
  //now when we have the component info, add them to the node instance models
  this.getNodesWithType(component.name).forEach(this._addComponentPorts.bind(this));

  //emit the "nodeAdded" event for every node already in the component
  component.getAllNodes().forEach(this._onNodeAdded.bind(this));

  //emit the same event for future nodes that will be added
  component.on('nodeAdded', this._onNodeAdded.bind(this), this);

  //and for nodes that are removed
  component.on('nodeRemoved', this._onNodeRemoved.bind(this), this);
  component.on('nodeWasRemoved', this._onNodeWasRemoved.bind(this), this);

  this.emit('componentAdded', component);
};

GraphModel.prototype.removeComponentWithName = async function (componentName) {
  if (this.components.hasOwnProperty(componentName) === false) {
    console.error('GraphModel: Component with name ' + componentName + ' not in graph');
    return;
  }

  var component = this.components[componentName];
  await component.reset();

  component.removeAllListeners();
  delete this.components[component.name];

  this.emit('componentRemoved', component);
};

GraphModel.prototype.renameComponent = function (componentName, newName) {
  if (this.components.hasOwnProperty(componentName) === false) {
    console.error('GraphModel: Component with name ' + componentName + ' not in graph');
    return;
  }

  this.getNodesWithType(componentName).forEach(function (nodeModel) {
    nodeModel.type = newName;
  });

  var component = this.components[componentName];
  component.rename(newName);

  delete this.components[componentName];
  this.components[newName] = component;

  this.emit('componentRenamed', component);
};

GraphModel.prototype._addComponentPorts = function (node) {
  //check if this node is a known component and add port to the model
  if (this.components.hasOwnProperty(node.type)) {
    //a component was created, add component ports to model
    var component = this.components[node.type];

    const inputPorts = component.getInputPorts();
    const outputPorts = component.getOutputPorts();

    Object.keys(inputPorts).forEach((portName) => {
      node.addInputPort(inputPorts[portName]);
    });

    Object.keys(outputPorts).forEach((portName) => {
      node.addOutputPort(outputPorts[portName]);
    });
  }
};

GraphModel.prototype._onNodeAdded = function (node) {
  this._addComponentPorts(node);

  this.emit('nodeAdded', node);
  this.emit('nodeAdded.' + node.type, node);
};

GraphModel.prototype._onNodeRemoved = function (node) {
  this.emit('nodeRemoved', node);
  this.emit('nodeRemoved.' + node.type, node);
};

GraphModel.prototype._onNodeWasRemoved = function (node) {
  this.emit('nodeWasRemoved', node);
  this.emit('nodeWasRemoved.' + node.type, node);
};

GraphModel.prototype.reset = async function () {
  for (const componentName of Object.keys(this.components)) {
    await this.removeComponentWithName(componentName);
  }
  this.setSettings({});
};

GraphModel.prototype.isEmpty = function () {
  return Object.keys(this.components).length === 0;
};

GraphModel.prototype.setSettings = function (settings) {
  this.settings = settings;
  this.emit('projectSettingsChanged', settings);
};

GraphModel.prototype.getSettings = function () {
  return this.settings;
};

GraphModel.prototype.setAllMetaData = function (metadata) {
  for (const p in metadata) {
    this.setMetaData(p, metadata[p]);
  }
};

GraphModel.prototype.setMetaData = function (key, data) {
  //metadata changes can trigger lots of ports to evaluate (e.g. when a database model has been changed)
  //check if the data actually has been updated before since the editor can send the same data multiple times
  if (this.metadata[key] && JSON.stringify(this.metadata[key]) === JSON.stringify(data)) {
    return;
  }

  this.metadata[key] = data;
  this.emit('metadataChanged', { key, data });
  this.emit('metadataChanged.' + key, data);
};

GraphModel.prototype.getMetaData = function (key) {
  if (key) return this.metadata[key];
  return this.metadata;
};

GraphModel.prototype.getVariants = function () {
  return this.variants || [];
};

GraphModel.prototype.getVariant = function (typename, name) {
  return this.variants.find((v) => v.name === name && v.typename === typename);
};

GraphModel.prototype.updateVariant = function (variant) {
  const i = this.variants.findIndex((v) => v.name === variant.name && v.typename === variant.typename);
  if (i !== -1) this.variants.splice(i, 1);
  this.variants.push(variant);

  this.emit('variantUpdated', variant);
};

GraphModel.prototype.updateVariantParameter = function (
  variantName,
  variantTypeName,
  parameterName,
  parameterValue,
  state
) {
  const variant = this.getVariant(variantTypeName, variantName);
  if (!variant) {
    console.log("updateVariantParameter: can't find variant", variantName, variantTypeName);
    return;
  }

  if (!state) {
    if (parameterValue === undefined) {
      delete variant.parameters[parameterName];
    } else {
      variant.parameters[parameterName] = parameterValue;
    }
  } else {
    if (!variant.stateParameters.hasOwnProperty(state)) {
      variant.stateParameters[state] = {};
    }

    if (parameterValue === undefined) {
      delete variant.stateParameters[state][parameterName];
    } else {
      variant.stateParameters[state][parameterName] = parameterValue;
    }
  }

  this.emit('variantUpdated', variant);
};

GraphModel.prototype.updateVariantDefaultStateTransition = function (variantName, variantTypeName, transition, state) {
  const variant = this.getVariant(variantTypeName, variantName);
  if (!variant) return;

  variant.defaultStateTransitions[state] = transition;
  this.emit('variantUpdated', variant);
};

GraphModel.prototype.updateVariantStateTransition = function (args) {
  const { variantTypeName, variantName, state, parameterName, curve } = args;

  const variant = this.getVariant(variantTypeName, variantName);
  if (!variant) return;

  if (!variant.stateTransitions[state]) {
    variant.stateTransitions[state] = {};
  }

  variant.stateTransitions[state][parameterName] = curve;
};

GraphModel.prototype.deleteVariant = function (typename, name) {
  const i = this.variants.findIndex((v) => v.name === name && v.typename === typename);
  if (i !== -1) this.variants.splice(i, 1);
};

module.exports = GraphModel;
