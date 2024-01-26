'use strict';

var EventSender = require('./eventsender'),
  Services = require('./services/services'),
  guid = require('./guid');

const ActiveWarnings = require('./editorconnection.activewarnings');
function EditorConnection(opts) {
  var _opts = opts || {};

  EventSender.call(this);

  this.runtimeType = _opts.runtimeType;
  this.platform = _opts.platform;
  this.ws =
    (_opts.platform && _opts.platform.webSocketClass) || (typeof WebSocket !== 'undefined' ? WebSocket : undefined);
  this.wsOptions = (_opts.platform && _opts.platform.webSocketOptions) || undefined;
  this.reconnectOnClose = true;
  this.enableDebugger = false;

  this.lastSendTimestamp = 0;
  this.sendQueue = [];
  this.sendTimer = undefined;

  //used to optimize warnings so we're not sending unneccessary warnings.
  //Clan slow down the editor in large projects
  this.activeWarnings = new ActiveWarnings();
}

EditorConnection.prototype = Object.create(EventSender.prototype);
EditorConnection.prototype.constructor = EditorConnection;

EditorConnection.prototype.isRunningLocally = function () {
  var runningLocallyInBrowser =
    (this.platform.isRunningLocally && this.platform.isRunningLocally()) ||
    (typeof document !== 'undefined' &&
      (document.location.hostname === 'localhost' || document.location.hostname === '127.0.0.1'));
  return runningLocallyInBrowser;
};

EditorConnection.prototype.connect = function (address) {
  this.socket = this.wsOptions ? new this.ws(address, this.wsOptions) : new this.ws(address);

  var self = this;

  this.socket.addEventListener('open', function () {
    self.clientId = guid();
    self.socket.send(
      JSON.stringify({
        cmd: 'register',
        type: 'viewer',
        clientId: self.clientId
      })
    );
    self.emit('connected');
  });

  this.socket.addEventListener('close', function (event) {
    if (self.reconnectOnClose) {
      self.reconnect(address);
    }
    console.log('Editor connection closed', event.code, event.reason);
    self.emit('connectionClosed');
  });

  this.socket.addEventListener('error', function (evt) {
    console.log('Editor connection error, trying to reconnect');
  });

  this.socket.addEventListener('message', async (e) => {
    // NOTE: When the data is too big it seems to change from string to a blob
    const text = typeof e.data === 'string' ? e.data : await e.data.text();
    const message = JSON.parse(text);

    let content;

    if (message.cmd === 'registered') {
      //ignore
    } else if (message.cmd === 'export') {
      content = JSON.parse(message.content);
      if (message.type === 'full' && message.target === this.clientId) {
        self.emit('exportDataFull', content);
      }
    } else if (message.cmd === 'hoverStart') {
      self.emit('hoverStart', message.content.id);
    } else if (message.cmd === 'hoverEnd') {
      self.emit('hoverEnd', message.content.id);
    } else if (message.cmd === 'refresh') {
      self.emit('reload');
    } else if (message.cmd === 'debugInspectors') {
      if (this.debugInspectorsEnabled) {
        content = JSON.parse(message.content);
        self.emit('debugInspectorsUpdated', content.inspectors);
      }
    } else if (message.cmd === 'debuggingEnabled') {
      if (self.isRunningLocally()) {
        content = JSON.parse(message.content);
        self.emit('debuggingEnabledChanged', content.enabled);
      }
    } else if (message.cmd === 'getConnectionValue') {
      if (self.isRunningLocally()) {
        content = JSON.parse(message.content);
        await self.emit('getConnectionValue', { clientId: content.clientId, connectionId: content.connectionId });
      }
    } else if (message.cmd === 'modelUpdate') {
      await self.emit('modelUpdate', message.content);
    } else if (message.cmd === 'publish') {
      Services.pubsub.routeMessage(message); // Publish a message from the pubsub service
    } else if (message.cmd === 'noodlModules') {
      self.emit('noodlModules', JSON.parse(message.content));
    } else if (message.cmd === 'mqttUpdate') {
      self.emit('mqttUpdate', message.content);
    } else if (message.cmd === 'activeComponentChanged') {
      self.emit('activeComponentChanged', message.component);
    } else {
      console.log('Command not implemented', message);
    }
  });
};

EditorConnection.prototype.reconnect = function (address) {
  var self = this;

  setTimeout(function () {
    self.connect(address);
  }, 2000);
};

EditorConnection.prototype.isConnected = function () {
  return this.socket !== undefined && this.socket.readyState === this.ws.OPEN;
};

//JSON replacer to make cyclic objects non-cyclic.
//Using this example: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value#examples
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
};

EditorConnection.prototype.send = function (data) {
  const now = this.platform.getCurrentTime();
  const dt = now - this.lastSendTimestamp;

  //Send objects as json and capture exceptions
  const trySend = (msg) => {
    try {
      this.socket.send(JSON.stringify(msg));
    } catch (e) {
      if (e.message && e.message.startsWith('Converting circular')) {
        //the object is circular, try to address it
        try {
          this.socket.send(JSON.stringify(msg, getCircularReplacer()));
        } catch (e) {
          //still failed, give up
          console.log('failed to send message to editor', msg, e);
        }
      } else {
        //message couldn't be serialized to json
        console.log('failed to send message to editor', msg, e);
      }
    }
  };

  //batch messages so they're only sent at most every 200ms
  //note that the first message will always be sent immediately, and the ones for 200ms after
  //that one will be queued. So initial message response time is as low as possible (for hover etc)
  if (dt < 200 || this.sendTimer || !this.isConnected()) {
    this.sendQueue.push(data);
    if (!this.sendTimer) {
      this.sendTimer = setTimeout(() => {
        if (this.isConnected() === false) {
          return;
        }

        //send messages in chunks. If we send too many at once the editor UI can freeze for a while
        //since it's handling these in the renderer process
        const chunkSize = 50;
        for (let i = 0; i < this.sendQueue.length; i += chunkSize) {
          const chunk = this.sendQueue.slice(i, i + chunkSize);
          trySend(chunk);
        }

        this.sendQueue = [];
        this.sendTimer = undefined;
        this.lastSendTimestamp = this.platform.getCurrentTime();
      }, 100);
    }
  } else {
    this.lastSendTimestamp = now;
    trySend(data);
  }
};

EditorConnection.prototype.sendInspectId = function (id) {
  this.send({
    cmd: 'select',
    type: 'viewer',
    content: JSON.stringify({ id: id })
  });
};

EditorConnection.prototype.sendSelectComponent = function (componentName) {
  this.send({
    cmd: 'select',
    type: 'viewer',
    content: JSON.stringify({ componentName })
  });
};

EditorConnection.prototype.sendPulsingConnections = function (connectionMap) {
  var connectionsToPulse = [];
  Object.keys(connectionMap).forEach(function (c) {
    var connection = connectionMap[c];
    connectionsToPulse = connectionsToPulse.concat(connection.connections);
  });

  this.send({
    cmd: 'connectiondebugpulse',
    type: 'viewer',
    content: JSON.stringify({
      connectionsToPulse: connectionsToPulse
    })
  });
};

EditorConnection.prototype.sendDebugInspectorValues = function (inspectors) {
  this.send({
    cmd: 'debuginspectorvalues',
    type: 'viewer',
    content: { inspectors }
  });
};

EditorConnection.prototype.sendConnectionValue = function (connectionId, value) {
  this.send({
    cmd: 'connectionValue',
    type: 'viewer',
    content: { connectionId, value }
  });
};

const dynamicPortsHash = {};

function _detectRename(before, after) {
  if (!before || !after) return;

  if (before.length !== after.length) return; // Must be of same length

  var res = {};
  for (var i = 0; i < before.length; i++) {
    if (after.indexOf(before[i]) === -1) {
      if (res.before) return; // Can only be one from before that is missing
      res.before = before[i];
    }

    if (before.indexOf(after[i]) === -1) {
      if (res.after) return; // Only one can be missing,otherwise we cannot match
      res.after = after[i];
    }
  }

  return res.before && res.after ? res : undefined;
}

EditorConnection.prototype.sendDynamicPorts = function (id, ports, options) {
  var hash = JSON.stringify(ports);
  if (dynamicPortsHash[id] === hash) {
    // Make sure we don't resend the same port data
    return;
  }

  if (dynamicPortsHash[id] && ports && options && options.detectRenamed) {
    var detectRenamed = Array.isArray(options.detectRenamed) ? options.detectRenamed : [options.detectRenamed];

    var renamed = [];
    detectRenamed.forEach((d) => {
      var before = JSON.parse(dynamicPortsHash[id]),
        after = [].concat(ports);

      // Filter ports with correct prefix and plug
      if (d.prefix) {
        before = before.filter((p) => p.name.startsWith(d.prefix));
        after = after.filter((p) => p.name.startsWith(d.prefix));
      }

      if (d.plug) {
        before = before.filter((p) => p.plug === d.plug);
        after = after.filter((p) => p.plug === d.plug);
      }

      // Remove the prefix
      after = after.map((p) => p.name.substring((d.prefix || '').length));
      before = before.map((p) => p.name.substring((d.prefix || '').length));

      // Find the one that is renamed (if any)
      var res = _detectRename(before, after);
      if (res) {
        renamed.push({
          plug: d.plug,
          patterns: [(d.prefix || '') + '{{*}}'],
          before: res.before,
          after: res.after
        });
      }
    });
    if (renamed.length > 0) options.renamed = renamed;

    delete options.detectRenamed;
  }

  dynamicPortsHash[id] = hash;

  this.send({
    cmd: 'instanceports',
    type: 'viewer',
    content: JSON.stringify({
      nodeid: id,
      ports: ports,
      options: options
    })
  });
};

EditorConnection.prototype.sendWarning = function (componentName, nodeId, key, warning) {
  const isNewWarning = this.activeWarnings.setWarning(nodeId, key, warning);

  if (isNewWarning) {
    this.send({
      cmd: 'showwarning',
      type: 'viewer',
      content: JSON.stringify({
        componentName: componentName,
        nodeId: nodeId,
        key: key,
        warning: warning
      })
    });
  }
};

EditorConnection.prototype.clearWarning = function (componentName, nodeId, key) {
  const hasWarning = this.activeWarnings.clearWarning(nodeId, key);

  if (hasWarning) {
    this.send({
      cmd: 'showwarning',
      type: 'viewer',
      content: JSON.stringify({
        componentName: componentName,
        nodeId: nodeId,
        key: key,
        warning: undefined
      })
    });
  }
};

EditorConnection.prototype.clearWarnings = function (componentName, nodeId) {
  const hasWarnings = this.activeWarnings.clearWarnings(nodeId);

  if (hasWarnings) {
    this.send({
      cmd: 'clearwarnings',
      type: 'viewer',
      content: JSON.stringify({
        componentName: componentName,
        nodeId: nodeId
      })
    });
  }
};

EditorConnection.prototype.sendPatches = function (patches) {
  this.send({
    cmd: 'patchproject',
    type: 'viewer',
    content: JSON.stringify(patches)
  });
};

EditorConnection.prototype.requestFullExport = function () {
  this.send({
    cmd: 'register',
    type: 'viewer'
  });
};

EditorConnection.prototype.requestNoodlModules = function () {
  this.send({
    cmd: 'getNoodlModules',
    type: 'viewer'
  });
};

var serviceRequests = {};
EditorConnection.prototype.sendServiceRequest = function (request, callback) {
  request.token = guid();
  request.clientId = this.clientId;
  serviceRequests[request.token] = callback;
  this.send(request);
};

EditorConnection.prototype.close = function () {
  this.reconnectOnClose = false;

  if (this.isConnected() === false) {
    return;
  }

  this.socket.close();
};

EditorConnection.prototype.sendNodeLibrary = function (nodelibrary) {
  this.send({
    cmd: 'nodelibrary',
    type: 'viewer',
    runtimeType: this.runtimeType,
    content: nodelibrary,
    clientId: this.clientId
  });
};

EditorConnection.prototype.sendComponentMetadata = function (componentName, key, data) {
  this.send({
    cmd: 'componentMetadata',
    type: 'viewer',
    content: JSON.stringify({
      componentName,
      key,
      data
    })
  });
};

EditorConnection.prototype.sendProjectMetadata = function (key, data) {
  this.send({
    cmd: 'projectMetadata',
    type: 'viewer',
    content: JSON.stringify({
      key,
      data
    })
  });
};

module.exports = EditorConnection;
