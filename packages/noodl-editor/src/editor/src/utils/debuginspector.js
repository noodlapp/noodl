'use strict';

const Model = require('../../../shared/model');
const { EventDispatcher } = require('../../../shared/utils/EventDispatcher');
const JSONStorage = require('../../../shared/utils/jsonstorage');
const { ProjectModel } = require('../models/projectmodel');

// --------------------------------------------------------------------
// DebugInspector
// --------------------------------------------------------------------
function DebugInspector() {
  this.connectionsToPulseState = {};

  //Object.keys version of connectionsToPulseState.
  //It's needed every frame when animating so keeping it cached saves some GC cycles
  this.connectionsToPulseIDs = [];
  this.inspectorValues = {};
  this.enabled = true;

  EventDispatcher.instance.on(['viewer-refreshed', 'viewer-closed'], () => this.reset());
}

function generateIdFromConnection(con) {
  return con.fromId + con.fromProperty + con.toId + con.toProperty;
}

DebugInspector.prototype.onAnimationFrame = function () {
  const now = window.performance.now();
  var connectionsRemoved = false;

  this.connectionsToPulseIDs.forEach((id) => {
    const con = this.connectionsToPulseState[id];
    const life = now - con.created;
    con.offset = life / 20;
    con.opacity = Math.min(1, life / 50);

    if (con.removed) {
      const timeRemoved = now - con.removed;
      con.opacity = 1 - timeRemoved / 500;
      if (con.opacity <= 0) {
        connectionsRemoved = true;
        delete this.connectionsToPulseState[id];
      }
    }
  });

  if (connectionsRemoved) {
    this.connectionsToPulseIDs = Object.keys(this.connectionsToPulseState);
  }

  if (this.connectionsToPulseIDs.length === 0) {
    this.playPulseAnimation = false;
  }

  EventDispatcher.instance.notifyListeners('DebugInspectorConnectionPulseChanged');

  if (this.playPulseAnimation) {
    window.requestAnimationFrame(this.onAnimationFrame.bind(this));
  }
};

DebugInspector.prototype.startPulseAnimations = function () {
  if (this.playPulseAnimation) {
    return;
  }

  this.playPulseAnimation = true;
  window.requestAnimationFrame(this.onAnimationFrame.bind(this));
};

DebugInspector.prototype.setConnectionsToPulse = function (connections) {
  var self = this;

  var now = window.performance.now();
  var pulsingConnectionIds = {};

  connections.forEach(function (id) {
    pulsingConnectionIds[id] = true;

    if (self.connectionsToPulseState.hasOwnProperty(id) === false) {
      self.connectionsToPulseState[id] = {
        created: now,
        offset: 0,
        opacity: 0,
        removed: false
      };
    } else {
      self.connectionsToPulseState[id].removed = false;
    }
  });

  this.connectionsToPulseIDs = Object.keys(this.connectionsToPulseState);

  this.connectionsToPulseIDs.forEach(function (id) {
    if (pulsingConnectionIds.hasOwnProperty(id) === false && self.connectionsToPulseState[id].removed === false) {
      self.connectionsToPulseState[id].removed = now;
    }
  });

  this.startPulseAnimations();
};

DebugInspector.prototype.reset = function () {
  this.inspectorValues = {};
  this.connectionsToPulseState = {};
  this.connectionsToPulseIDs = [];
  this.playPulseAnimation = false;

  EventDispatcher.instance.notifyListeners('DebugInspectorReset');
};

DebugInspector.prototype.isConnectionPulsing = function (connection) {
  var id = generateIdFromConnection(connection);
  return this.connectionsToPulseState.hasOwnProperty(id);
};

DebugInspector.prototype.getPulseAnimationState = function (connection) {
  var id = generateIdFromConnection(connection);
  return this.connectionsToPulseState[id];
};

DebugInspector.prototype.isEnabled = function () {
  return this.enabled;
};

DebugInspector.prototype.setEnabled = function (enabled) {
  this.enabled = enabled;
  EventDispatcher.instance.notifyListeners('DebugInspectorEnabledChanged');
};

DebugInspector.prototype.setInspectorValues = function (inspectorValues) {
  inspectorValues.forEach((inspectorValue) => {
    this._setInspectorValue(inspectorValue);
  });
};

DebugInspector.prototype._setInspectorValue = function ({ id, value }) {
  this.inspectorValues[id] = value;
  EventDispatcher.instance.notifyListeners('DebugInspectorDataChanged.' + id, { value });
};

DebugInspector.prototype.getConnectionId = function (connection) {
  return connection.fromId + connection.fromProperty;
};

DebugInspector.prototype.valueForNode = function (nodeId) {
  if (this.inspectorValues.hasOwnProperty(nodeId)) {
    return this.inspectorValues[nodeId];
  }
};

DebugInspector.prototype.valueForConnection = function (connection) {
  const id = this.getConnectionId(connection);
  if (this.inspectorValues.hasOwnProperty(id)) {
    return { type: 'value', value: this.inspectorValues[id] };
  }

  //check if this is a signal, and in that case indicate that it hasn't been sent
  const node = ProjectModel.instance.findNodeWithId(connection.fromId);
  if (node === undefined) return;

  const port = node.getPort(connection.fromProperty);
  if (port && port.type === 'signal') {
    return { type: 'value', value: '[Signal] Not triggered' };
  }

  return undefined; //no value found
};

DebugInspector.instance = new DebugInspector();

// --------------------------------------------------------------------
// DebugInspector.InspectorsModel
// --------------------------------------------------------------------
DebugInspector.InspectorsModel = function (args) {
  Model.call(this);

  for (var i in args) this[i] = args[i];

  if (this.inspectors) {
    //update old inspectors that didn't have a type
    this.inspectors.filter((inspector) => !inspector.type).forEach((inspector) => inspector.type === 'connection');
  } else {
    this.inspectors = [];
  }
};

DebugInspector.InspectorsModel.prototype = Object.create(Model.prototype);

DebugInspector.InspectorsModel.prototype.addInspectorForConnection = function (args) {
  var connection = args.connection;

  var inspector = {
    connectionKey: generateIdFromConnection(connection),
    type: 'connection',
    pinned: false,
    position: args.position,
    connection: {
      fromId: connection.fromId,
      fromProperty: connection.fromProperty,
      toId: connection.toId,
      toProperty: connection.toProperty
    }
  };

  this.inspectors.push(inspector);
  this.notifyListeners('inspectorAdded', { model: inspector });
  DebugInspector.InspectorsModel.save();
  return inspector;
};

DebugInspector.InspectorsModel.prototype.addInspectorForNode = function (args) {
  var node = args.node;

  var inspector = { type: 'node', nodeId: node.id, pinned: false, position: args.position };

  this.inspectors.push(inspector);
  this.notifyListeners('inspectorAdded', { model: inspector });
  DebugInspector.InspectorsModel.save();
  return inspector;
};

DebugInspector.InspectorsModel.prototype.removeInspector = function (inspector) {
  var idx = this.inspectors.indexOf(inspector);
  if (idx !== -1) {
    this.inspectors.splice(idx, 1);
    this.notifyListeners('inspectorRemoved', { model: inspector });
    DebugInspector.InspectorsModel.save();
  }
};

DebugInspector.InspectorsModel.prototype.pinInspector = function (inspector) {
  inspector.pinned = true;
  DebugInspector.InspectorsModel.save();
};

DebugInspector.InspectorsModel.prototype.getInspectors = function () {
  return this.inspectors;
};

DebugInspector.InspectorsModel.prototype.toJSON = function () {
  var json = {
    inspectors: this.inspectors
  };
  return json;
};

DebugInspector.InspectorsModel.fromJSON = function (json) {
  return new DebugInspector.InspectorsModel(json);
};

var inspectorsModels = {};
DebugInspector.InspectorsModel.instanceForProject = function (project) {
  if (!inspectorsModels[project.id]) {
    inspectorsModels[project.id] = new DebugInspector.InspectorsModel({});
  }

  return inspectorsModels[project.id];
};

DebugInspector.InspectorsModel.fetch = function () {
  JSONStorage.get('connection-debugger-inspectors', function (local) {
    var models = local['connection-debugger-inspectors'];
    for (var i in models) {
      inspectorsModels[i] = DebugInspector.InspectorsModel.fromJSON(models[i]);
    }
  });
};
DebugInspector.InspectorsModel.fetch();

DebugInspector.InspectorsModel.save = function () {
  var models = {};
  for (var i in inspectorsModels) models[i] = inspectorsModels[i].toJSON();

  JSONStorage.set('debugInspector', { 'debug-inspector-inspectors': models });
};

module.exports = DebugInspector;
