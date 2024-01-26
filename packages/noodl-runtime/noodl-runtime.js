'use strict';

const NodeContext = require('./src/nodecontext');
const EditorConnection = require('./src/editorconnection');
const generateNodeLibrary = require('./src/nodelibraryexport');
const ProjectSettings = require('./src/projectsettings');
const GraphModel = require('./src/models/graphmodel');
const NodeDefinition = require('./src/nodedefinition');
const Node = require('./src/node');
const EditorModelEventsHandler = require('./src/editormodeleventshandler');
const Services = require('./src/services/services');
const EdgeTriggeredInput = require('./src/edgetriggeredinput');

const EventEmitter = require('./src/events');
const asyncPool = require('./src/async-pool');

function registerNodes(noodlRuntime) {
  [
    require('./src/nodes/componentinputs'),
    require('./src/nodes/componentoutputs'),

    require('./src/nodes/std-library/runtasks'),

    // Data
    require('./src/nodes/std-library/data/restnode'),

    // Custom code
    require('./src/nodes/std-library/expression'),
    require('./src/nodes/std-library/simplejavascript'),

    // Records
    require('./src/nodes/std-library/data/dbcollectionnode2'),
    require('./src/nodes/std-library/data/dbmodelnode2'),
    require('./src/nodes/std-library/data/setdbmodelpropertiesnode'),
    require('./src/nodes/std-library/data/deletedbmodelpropertiesnode'),
    require('./src/nodes/std-library/data/newdbmodelpropertiesnode'),
    require('./src/nodes/std-library/data/dbmodelnode-addrelation'),
    require('./src/nodes/std-library/data/dbmodelnode-removerelation'),
    require('./src/nodes/std-library/data/filterdbmodelsnode'),

    // Object
    require('./src/nodes/std-library/data/modelnode2'),
    require('./src/nodes/std-library/data/setmodelpropertiesnode'),
    require('./src/nodes/std-library/data/newmodelnode'),

    // Cloud
    require('./src/nodes/std-library/data/cloudfilenode'),
    require('./src/nodes/std-library/data/dbconfig'),

    // Variables
    require('./src/nodes/std-library/variables/number'),
    require('./src/nodes/std-library/variables/string'),
    require('./src/nodes/std-library/variables/boolean'),

    // Utils
    require('./src/nodes/std-library/condition'),
    require('./src/nodes/std-library/and'),
    require('./src/nodes/std-library/or'),
    require('./src/nodes/std-library/booleantostring'),
    require('./src/nodes/std-library/datetostring'),
    require('./src/nodes/std-library/stringmapper'),
    require('./src/nodes/std-library/inverter'),
    require('./src/nodes/std-library/substring'),
    require('./src/nodes/std-library/stringformat'),
    require('./src/nodes/std-library/counter'),
    require('./src/nodes/std-library/uniqueid'),

    // User
    require('./src/nodes/std-library/user/setuserproperties'),
    require('./src/nodes/std-library/user/user')
  ].forEach((node) => noodlRuntime.registerNode(node));
}

function NoodlRuntime(args) {
  args = args || {};
  args.platform = args.platform || {};
  NoodlRuntime.instance = this;

  this.type = args.type || 'browser';
  this.noodlModules = [];
  this.eventEmitter = new EventEmitter();
  this.updateScheduled = false;
  this.rootComponent = null;
  this._currentLoadedData = null;
  this.isWaitingForExport = true;
  this.graphModel = new GraphModel();
  this.errorHandlers = [];
  this.frameNumber = 0;
  this.dontCreateRootComponent = !!args.dontCreateRootComponent;
  this.componentFilter = args.componentFilter;

  this.runningInEditor = args.runDeployed ? false : true;

  this.platform = {
    requestUpdate: args.platform.requestUpdate,
    getCurrentTime: args.platform.getCurrentTime,
    webSocketOptions: args.platform.webSocketOptions,
    objectToString: args.platform.objectToString
  };

  if (!args.platform.requestUpdate) {
    throw new Error('platform.requestUpdate must be set');
  }

  if (!args.platform.getCurrentTime) {
    throw new Error('platform.getCurrentTime must be set');
  }

  //Create an editor connection even if we're running deployed.
  //If won't connect and act as a "noop" in deployed mode,
  // and reduce the need for lots of if(editorConnection)
  this.editorConnection = new EditorConnection({
    platform: args.platform,
    runtimeType: this.type
  });

  this.context = new NodeContext({
    runningInEditor: args.runDeployed ? false : true,
    editorConnection: this.editorConnection,
    platform: this.platform,
    graphModel: this.graphModel
  });

  this.context.eventEmitter.on('scheduleUpdate', this.scheduleUpdate.bind(this));

  if (!args.runDeployed) {
    this._setupEditorCommunication(args);
  }

  this.registerGraphModelListeners();

  registerNodes(this);
}

NoodlRuntime.prototype.prefetchBundles = async function (bundleNames, numParallelFetches) {
  await asyncPool(numParallelFetches, bundleNames, async (name) => {
    await this.context.fetchComponentBundle(name);
  });
};

NoodlRuntime.prototype._setupEditorCommunication = function (args) {
  function objectEquals(x, y) {
    if (x === null || x === undefined || y === null || y === undefined) {
      return x === y;
    }
    if (x === y) {
      return true;
    }
    if (Array.isArray(x) && x.length !== y.length) {
      return false;
    }

    // if they are strictly equal, they both need to be object at least
    if (!(x instanceof Object)) {
      return false;
    }
    if (!(y instanceof Object)) {
      return false;
    }

    // recursive object equality check
    var p = Object.keys(x);
    return (
      Object.keys(y).every(function (i) {
        return p.indexOf(i) !== -1;
      }) &&
      p.every(function (i) {
        return objectEquals(x[i], y[i]);
      })
    );
  }

  this.editorConnection.on('exportDataFull', async (exportData) => {
    if (this.graphModel.isEmpty() === false) {
      this.reload();
      return;
    }

    this.isWaitingForExport = false;
    if (objectEquals(this._currentLoadedData, exportData) === false) {
      if (this.componentFilter) {
        exportData.components = exportData.components.filter((c) => this.componentFilter(c));
      }

      await this.setData(exportData);

      //get the rest of the components
      //important to get all the dynamic ports evaluated
      if (exportData.componentIndex) {
        const allBundles = Object.keys(exportData.componentIndex);
        await this.prefetchBundles(allBundles, 2);
      }

      this.graphModel.emit('editorImportComplete');
    }
  });

  this.editorConnection.on('reload', this.reload.bind(this));
  this.editorConnection.on('modelUpdate', this.onModelUpdateReceived.bind(this));
  this.editorConnection.on('metadataUpdate', this.onMetaDataUpdateReceived.bind(this));

  this.editorConnection.on('connected', () => {
    this.sendNodeLibrary();
  });
};

NoodlRuntime.prototype.setDebugInspectorsEnabled = function (enabled) {
  this.context.setDebugInspectorsEnabled(enabled);
};

NoodlRuntime.prototype.registerModule = function (module) {
  if (module.nodes) {
    for (let nodeDefinition of module.nodes) {
      if (!nodeDefinition.node) nodeDefinition = { node: nodeDefinition };
      nodeDefinition.node.module = module.name || 'Unknown Module';
      this.registerNode(nodeDefinition);
    }
  }

  this.noodlModules.push(module);
};

NoodlRuntime.prototype.registerGraphModelListeners = function () {
  var self = this;

  this.graphModel.on(
    'componentAdded',
    function (component) {
      self.context.registerComponentModel(component);
    },
    this
  );

  this.graphModel.on(
    'componentRemoved',
    function (component) {
      self.context.deregisterComponentModel(component);
    },
    this
  );
};

NoodlRuntime.prototype.reload = function () {
  location.reload();
};

NoodlRuntime.prototype.registerNode = function (nodeDefinition) {
  if (nodeDefinition.node) {
    const definedNode = NodeDefinition.defineNode(nodeDefinition.node);
    this.context.nodeRegister.register(definedNode);

    definedNode.setupNumberedInputDynamicPorts &&
      definedNode.setupNumberedInputDynamicPorts(this.context, this.graphModel);
  } else {
    this.context.nodeRegister.register(nodeDefinition);
  }

  nodeDefinition.setup && nodeDefinition.setup(this.context, this.graphModel);
};

NoodlRuntime.prototype._setRootComponent = async function (rootComponentName) {
  if (this.rootComponent && this.rootComponent.name === rootComponentName) return;

  if (this.rootComponent) {
    this.rootComponent.model && this.rootComponent.model.removeListenersWithRef(this);
    this.rootComponent = undefined;
  }

  if (rootComponentName) {
    this.rootComponent = await this.context.createComponentInstanceNode(rootComponentName, 'rootComponent');

    this.rootComponent.componentModel.on('rootAdded', () => this.eventEmitter.emit('rootComponentUpdated'), this);
    this.rootComponent.componentModel.on('rootRemoved', () => this.eventEmitter.emit('rootComponentUpdated'), this);

    this.context.setRootComponent(this.rootComponent);
  }

  this.eventEmitter.emit('rootComponentUpdated');
};

NoodlRuntime.prototype.setData = async function (graphData) {
  // Added for SSR Support
  // In SSR, we re-load the graphData and when we render the componet it will
  // invoke this method again, which will cause a duplicate node exception.
  // To avoid this, we flag the runtime to not load again.
  if (this._disableLoad) return;

  this._currentLoadedData = graphData;
  await this.graphModel.importEditorData(graphData);

  // Run setup on all modules
  for (const module of this.noodlModules) {
    typeof module.setup === 'function' && module.setup.apply(module);
  }

  if (this.dontCreateRootComponent !== true) {
    await this._setRootComponent(this.graphModel.rootComponent);

    //listen to delta updates on the root component
    this.graphModel.on('rootComponentNameUpdated', (name) => {
      this._setRootComponent(name);
    });

    //check if the root component was deleted
    this.graphModel.on('componentRemoved', (componentModel) => {
      if (this.rootComponent && this.rootComponent.name === componentModel.name) {
        this._setRootComponent(null);
      }
    });

    //check if the root component was added when it previously didn't exist (e.g. when user deletes it and then hits undo)
    this.graphModel.on('componentAdded', (componentModel) => {
      setTimeout(() => {
        if (!this.rootComponent && this.graphModel.rootComponent === componentModel.name) {
          this._setRootComponent(componentModel.name);
        }
      }, 1);
    });
  }

  this.scheduleUpdate();
};

NoodlRuntime.prototype.scheduleUpdate = function () {
  if (this.updateScheduled) {
    return;
  }

  this.updateScheduled = true;
  this.platform.requestUpdate(NoodlRuntime.prototype._doUpdate.bind(this));
};

NoodlRuntime.prototype._doUpdate = function () {
  this.updateScheduled = false;

  this.context.currentFrameTime = this.platform.getCurrentTime();

  this.context.eventEmitter.emit('frameStart');

  this.context.update();

  this.context.eventEmitter.emit('frameEnd');

  this.frameNumber++;
};

NoodlRuntime.prototype.setProjectSettings = function (settings) {
  this.projectSettings = settings;
};

NoodlRuntime.prototype.getNodeLibrary = function () {
  var projectSettings = ProjectSettings.generateProjectSettings(this.graphModel.getSettings(), this.noodlModules);

  if (this.projectSettings) {
    this.projectSettings.ports && (projectSettings.ports = projectSettings.ports.concat(this.projectSettings.ports));
    this.projectSettings.dynamicports &&
      (projectSettings.dynamicports = projectSettings.ports.concat(this.projectSettings.dynamicports));
  }

  var nodeLibrary = generateNodeLibrary(this.context.nodeRegister);
  nodeLibrary.projectsettings = projectSettings;
  return JSON.stringify(nodeLibrary, null, 3);
};

NoodlRuntime.prototype.sendNodeLibrary = function () {
  const nodeLibrary = this.getNodeLibrary();
  if (this.lastSentNodeLibrary !== nodeLibrary) {
    this.lastSentNodeLibrary = nodeLibrary;
    this.editorConnection.sendNodeLibrary(nodeLibrary);
  }
};

NoodlRuntime.prototype.connectToEditor = function (address) {
  this.editorConnection.connect(address);
};

NoodlRuntime.prototype.onMetaDataUpdateReceived = function (event) {
  if (!this.graphModel.isEmpty()) {
    EditorMetaDataEventsHandler.handleEvent(this.context, this.graphModel, event);
  }
};

NoodlRuntime.prototype.onModelUpdateReceived = async function (event) {
  if (this.isWaitingForExport) {
    return;
  }

  if (event.type === 'projectInstanceChanged') {
    this.reload();
  }
  //wait for data to load before applying model changes
  else if (this.graphModel.isEmpty() === false) {
    await EditorModelEventsHandler.handleEvent(this.context, this.graphModel, event);
  }
};

NoodlRuntime.prototype.addErrorHandler = function (callback) {
  this.errorHandlers.push(callback);
};

NoodlRuntime.prototype.reportError = function (message) {
  this.errorHandlers.forEach(function (eh) {
    eh(message);
  });
};

NoodlRuntime.prototype.getProjectSettings = function () {
  return this.graphModel.getSettings();
};

NoodlRuntime.prototype.getMetaData = function (key) {
  return this.graphModel.getMetaData(key);
};

NoodlRuntime.Services = Services;
NoodlRuntime.Node = Node;
NoodlRuntime.NodeDefinition = NodeDefinition;
NoodlRuntime.EdgeTriggeredInput = EdgeTriggeredInput;

module.exports = NoodlRuntime;
