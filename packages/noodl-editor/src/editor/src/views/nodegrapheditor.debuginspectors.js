const DebugInspector = require('../utils/debuginspector');
const { ProjectModel } = require('../models/projectmodel');
const { InspectPopup } = require('./nodegrapheditor/InspectJSONView/InspectPopup');
const ReactDOM = require('react-dom');
const React = require('react');
const { EventDispatcher } = require('../../../shared/utils/EventDispatcher');

// --------------------------------------------------------------
// DebugInspector
// --------------------------------------------------------------
function DebugInspectorPopup(args) {
  this.model = args.model;
  this.owner = args.owner;

  this.div = document.createElement('div');
  this.div.style.position = 'absolute';
  this.div.style.width = 'max-content';
  this.div.style.transform = 'translate(-50%, calc(-100% - 4px))';

  args.parentElement.appendChild(this.div);
}

DebugInspectorPopup.prototype.togglePinned = function () {
  const inspectorModel = DebugInspector.InspectorsModel.instanceForProject(ProjectModel.instance);
  if (this.model.pinned) {
    // Unpin/remove
    this.remove();
  } else {
    // Pin
    inspectorModel.pinInspector(this.model);
  }

  this.render();
};

DebugInspectorPopup.prototype.isPinned = function () {
  return this.model.pinned;
};

DebugInspectorPopup.prototype.remove = function () {
  DebugInspector.InspectorsModel.instanceForProject(ProjectModel.instance).removeInspector(this.model);
  this.dispose();
};

DebugInspectorPopup.prototype.render = function () {
  const debugValue = this.getValue();
  const pos = this.getAttachPosition();

  if (!pos) {
    return;
  }

  this.div.style.left = pos.x + 'px';
  this.div.style.top = pos.y + 'px';

  const onPinClicked = () => {
    this.togglePinned();
  };

  ReactDOM.render(React.createElement(InspectPopup, { debugValue, onPinClicked, pinned: this.model.pinned }), this.div);
};

DebugInspectorPopup.prototype.dispose = function () {
  ReactDOM.unmountComponentAtNode(this.div);
  if (this.div.parentElement) {
    this.div.parentElement.removeChild(this.div);
  }
};

// --------------------------------------------------------------
// ConnectionInspector
// --------------------------------------------------------------
function ConnectionInspector(args) {
  DebugInspectorPopup.call(this, args);
  this.connection = args.connection;

  const id = DebugInspector.instance.getConnectionId(this.connection);

  EventDispatcher.instance.on(
    ['DebugInspectorDataChanged.' + id, 'DebugInspectorReset'],
    () => {
      this.render();
    },
    this
  );
}

ConnectionInspector.prototype = Object.create(DebugInspectorPopup.prototype);

ConnectionInspector.prototype.dispose = function () {
  DebugInspectorPopup.prototype.dispose.call(this);
  EventDispatcher.instance.off(this);
};

ConnectionInspector.prototype.getValue = function () {
  return DebugInspector.instance.valueForConnection(this.connection.model);
};

ConnectionInspector.prototype.getAttachPosition = function () {
  var c = this.connection;
  return c.pointOnCurve(this.model.position);
};

ConnectionInspector.prototype.getOrientation = function () {
  var c = this.connection;
  var from = c.fromNode.global;
  var to = c.toNode.global;

  if (Math.abs(from.x - to.x) > Math.abs(from.y - to.y)) return 'horizontal';
  else return 'vertical';
};

// --------------------------------------------------------------
// NodeInspector
// --------------------------------------------------------------

function NodeInspector(args) {
  DebugInspectorPopup.call(this, args);
  this.node = args.node;

  EventDispatcher.instance.on(
    ['DebugInspectorDataChanged.' + this.model.nodeId, 'DebugInspectorReset'],
    () => {
      this.render();
    },
    this
  );
}

NodeInspector.prototype = Object.create(DebugInspectorPopup.prototype);

NodeInspector.prototype.dispose = function () {
  DebugInspectorPopup.prototype.dispose.call(this);
  EventDispatcher.instance.off(this);
};

NodeInspector.prototype.getAttachPosition = function () {
  return {
    x: this.node.global.x + this.node.nodeSize.width / 2,
    y: this.node.global.y
  };
};

NodeInspector.prototype.getValue = function () {
  return DebugInspector.instance.valueForNode(this.model.nodeId);
};

module.exports = {
  ConnectionInspector,
  NodeInspector
};
