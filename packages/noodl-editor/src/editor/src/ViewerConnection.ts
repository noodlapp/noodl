import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { NodeLibraryImporter } from '@noodl-models/nodelibrary/NodeLibraryImporter';

import Model from '../../shared/model';
import { EventDispatcher } from '../../shared/utils/EventDispatcher';
import ProjectModules from '../../shared/utils/projectmodules';
import { NodeLibrary } from './models/nodelibrary';
import { ProjectModel } from './models/projectmodel';
import { WarningRef, WarningsModel } from './models/warningsmodel';
import DebugInspector from './utils/debuginspector';
import * as Exporter from './utils/exporter';

const port = process.env.NOODLPORT || 8574;

export class ViewerConnection extends Model {
  modelChangesListenerGroup: unknown;
  watchModelChangesDisabled: boolean;
  lastExports: object;
  clientsToExportTo: Set<unknown>;
  registeredRuntimeTypes: Set<unknown>;
  highlightedNode: NodeGraphNode;

  static instance: ViewerConnection;
  ws: WebSocket;

  constructor() {
    super();

    // Connect to viewer server, wait a second to allow the server to start properly
    setTimeout(() => {
      this.connect();
    }, 1000);

    this.lastExports = {};
    this.clientsToExportTo = new Set();
    this.registeredRuntimeTypes = new Set();
    this.bindDebugInspectorEvents();
  }

  connect() {
    const _this = this;

    const protocol = process.env.ssl ? 'wss://' : 'ws://';
    const address = protocol + 'localhost:' + port;

    this.ws = new WebSocket(address);
    this.ws.addEventListener('open', function () {
      console.log('Connected to viewer server at ' + address);
      _this.send({ cmd: 'register', type: 'editor' });
      _this.watchAndExportModelChanges();
    });
    this.ws.addEventListener('close', function () {
      console.log('Connection to viewer server lost, attemtping to reconnect...');
      _this.stopWatchAndExportModelChanges();

      setTimeout(function () {
        _this.connect();
      }, 2000);
    });
    this.ws.addEventListener('message', async function (e) {
      // NOTE: When the data is too big it seems to change from string to a blob
      const text = typeof e.data === 'string' ? e.data : await e.data.text();
      const msg = JSON.parse(text);
      const messages = !Array.isArray(msg) ? [msg] : msg;
      for (const message of messages) {
        _this.processRequest(message);
      }
    });

    let totalWarnings;
    WarningsModel.instance.on('warningsChanged', function () {
      const newTotalWarnings = WarningsModel.instance.getTotalNumberOfWarnings({ levels: ['error'] });
      if (totalWarnings !== undefined && newTotalWarnings < totalWarnings) {
        // Warnings have been resolved, issue an export
        _this.export();
        console.log('Warnings have been resolved, doing full export');
      }
      totalWarnings = newTotalWarnings;
    });
  }

  processRequest(request) {
    if (!request) return;

    // A new viewer is connected
    if (request.cmd === 'registered' && request.type === 'viewer') {
      WarningsModel.instance.clearWarningsForRefMatching((ref) => ref.isFromViewer);
      this.sendDebugInspectorsEnabled();
    }
    //a viewer disconnected
    else if (request.cmd === 'disconnect') {
      this.clientsToExportTo.delete(request.clientId);
      NodeLibraryImporter.instance.onClientDisconnect(request.clientId);
    }
    // A select node request
    else if (request.cmd === 'select' && request.type === 'viewer') {
      const content = JSON.parse(request.content);
      this.notifyListeners('select', content);
    }
    // Dynamic ports for a node is reported
    else if (request.cmd === 'instanceports' && request.type === 'viewer') {
      const content = JSON.parse(request.content);
      const node = ProjectModel.instance.findNodeWithId(content.nodeid);
      node && node.setDynamicPorts(content.ports, content.options);
    } else if (request.cmd === 'connectiondebugpulse' && request.type === 'viewer') {
      const content = JSON.parse(request.content);
      DebugInspector.instance.setConnectionsToPulse(content.connectionsToPulse);
    } else if (request.cmd === 'debuginspectorvalues' && request.type === 'viewer') {
      DebugInspector.instance.setInspectorValues(request.content.inspectors);
    } else if (request.cmd === 'connectionValue' && request.type === 'viewer') {
      EventDispatcher.instance.emit('ConnectionInspector', request.content);
    } else if (request.cmd === 'showwarning' && request.type === 'viewer') {
      const content = JSON.parse(request.content);
      if (ProjectModel.instance !== undefined) {
        const ref: WarningRef = {
          component: ProjectModel.instance.getComponentWithName(content.componentName),
          node: ProjectModel.instance.findNodeWithId(content.nodeId),
          key: content.key,
          isFromViewer: true
        };
        if (ref.component && ref.node) {
          WarningsModel.instance.setWarning(ref, content.warning);
        }
      }
    } else if (request.cmd === 'clearwarnings' && request.type === 'viewer') {
      const content = JSON.parse(request.content);
      const ref: WarningRef = {
        component: ProjectModel.instance.getComponentWithName(content.componentName),
        node: ProjectModel.instance.findNodeWithId(content.nodeId)
      };
      if (ref.component && ref.node) {
        WarningsModel.instance.clearWarningsForRef(ref);
      }
    } else if (request.cmd === 'nodelibrary' && request.type === 'viewer') {
      const content = JSON.parse(request.content);

      this.loadNodeLibrary(request.clientId, request.runtimeType, content);
    } else if (request.cmd === 'sendToOtherClients' && request.type === 'viewer') {
      this.send({
        cmd: 'messageFromOtherClient',
        clientId: request.clientId,
        content: request.content
      });
    } else if (request.cmd === 'getNoodlModules' && request.type === 'viewer') {
      ProjectModules.instance.scanProjectModules(ProjectModel.instance._retainedProjectDirectory, (modules) => {
        this.send({
          cmd: 'noodlModules',
          content: JSON.stringify(modules ? modules : [])
        });
      });
    } else if (request.cmd === 'componentMetadata' && request.type === 'viewer') {
      const content = JSON.parse(request.content);
      const component = ProjectModel.instance.getComponentWithName(content.componentName);
      component && component.setMetaData(content.key, content.data);
    } else if (request.cmd === 'projectMetadata' && request.type === 'viewer') {
      const content = JSON.parse(request.content);
      ProjectModel.instance.setMetaData(content.key, content.data);
    } else {
      console.log('Unknown request');
      console.log(request);
    }
  }

  _exportToClient(clientId, exportedJSON) {
    //don't send the same export twice
    if (exportedJSON === this.lastExports[clientId]) return;

    this.send({
      cmd: 'export',
      type: 'full',
      content: exportedJSON,
      target: clientId
    });

    //send all inspectors
    if (ProjectModel.instance) {
      const inspectorsModel = DebugInspector.InspectorsModel.instanceForProject(ProjectModel.instance);
      this.sendDebugInspectors(inspectorsModel, clientId);
    }

    this.lastExports[clientId] = exportedJSON;
  }

  export(target?) {
    if (!ProjectModel.instance) {
      return;
    }

    let _export = Exporter.exportToJSON(ProjectModel.instance, {
      useBundles: false
    });

    //if there's no export (no root component), just send an empty export
    //so viewer can show an error
    if (!_export) {
      _export = {
        rootComponent: null,
        components: []
      };
    }

    const exportedJSON = JSON.stringify(_export);

    if (target) {
      this._exportToClient(target, exportedJSON);
    } else {
      for (const clientId of this.clientsToExportTo.values()) {
        this._exportToClient(clientId, exportedJSON);
      }
    }
  }

  send(request) {
    if (this.ws && this.ws.readyState == 1) {
      this.ws.send(JSON.stringify(request));
    }
  }

  sendNodeHighlighted(node: NodeGraphNode, highlighted: boolean) {
    if (highlighted) {
      // Send and store this node as the highlighted node
      if (this.highlightedNode === node) return;

      if (this.highlightedNode) {
        // Cancel existing highlight
        this.send({
          cmd: 'hoverEnd',
          content: { id: this.highlightedNode.id }
        });
      }
      this.highlightedNode = node;

      this.send({
        cmd: 'hoverStart',
        content: { id: node.id }
      });
    } else {
      if (this.highlightedNode == node) this.highlightedNode = undefined;

      this.send({
        cmd: 'hoverEnd',
        content: { id: node.id }
      });
    }
  }

  sendRefresh() {
    this.send({ cmd: 'refresh' });
  }

  sendDebugInspectors(inspectorModel, target?) {
    const inspectors = inspectorModel.inspectors.map((inspector) => {
      if (inspector.type === 'connection') {
        return {
          type: 'connection',
          connection: inspector.connection
        };
      }
      return {
        type: 'node',
        nodeId: inspector.nodeId
      };
    });

    this.send({
      cmd: 'debugInspectors',
      content: JSON.stringify({ inspectors }),
      target
    });
  }

  sendDebugInspectorsEnabled() {
    this.send({
      cmd: 'debuggingEnabled',
      content: JSON.stringify({
        enabled: DebugInspector.instance.isEnabled()
      })
    });
  }

  bindDebugInspectorEvents() {
    EventDispatcher.instance.on(
      'Model.inspectorAdded',
      (inspector) => {
        this.sendDebugInspectors(inspector.model);
      },
      null
    );
    EventDispatcher.instance.on(
      'Model.inspectorRemoved',
      (inspector) => {
        this.sendDebugInspectors(inspector.model);
      },
      null
    );
    EventDispatcher.instance.on(
      'DebugInspectorEnabledChanged',
      () => {
        this.sendDebugInspectorsEnabled();
      },
      null
    );
  }

  sendGetConnectionValue(clientId, connectionId) {
    this.send({
      cmd: 'getConnectionValue',
      content: JSON.stringify({ clientId, connectionId })
    });
  }

  /**
   * @param {string} clientId
   * @param {require('@noodl-models/nodelibrary/NodeLibraryData').RuntimeType} runtimeType
   * @param {require('@noodl-models/nodelibrary/NodeLibraryData').NodeLibraryData} newLibrary
   */
  loadNodeLibrary(clientId, runtimeType, newLibrary) {
    this.clientsToExportTo.add(clientId);
    this.registeredRuntimeTypes.add(runtimeType);

    NodeLibraryImporter.instance.onClientImport(clientId, runtimeType, newLibrary);

    if (NodeLibrary.instance.isLoaded()) {
      this.export();
    }
  }

  stopWatchAndExportModelChanges() {
    EventDispatcher.instance.off(this.modelChangesListenerGroup);
    this.modelChangesListenerGroup = undefined;
  }

  watchAndExportModelChanges() {
    const _this = this;

    if (this.modelChangesListenerGroup) {
      //we're already listening, remove old listeners before adding new ones
      this.stopWatchAndExportModelChanges();
    }

    this.modelChangesListenerGroup = {};

    EventDispatcher.instance.on(
      'Model.settingsChanged',
      function (event) {
        if (_this.watchModelChangesDisabled) return;

        if (event.model instanceof ProjectModel) {
          _this.send({
            cmd: 'modelUpdate',
            content: {
              type: 'settingsChanged',
              settings: event.model.settings
            }
          });
        }
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.componentRenamed',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'componentRenamed',
            oldName: e.args.oldName,
            newName: e.args.model.name
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.nodeAdded',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (e.model.owner === undefined) return; // Not part of component
        if (e.model.owner.owner !== ProjectModel.instance) return; // Not part of current project

        if (!e.model.owner) return; //Model is being created, no owner yet. Viewer will use full export
        if (NodeLibrary.instance.typeIsMissing(e.args.model.type)) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'nodeAdded',
            model: Exporter.exportNode(e.args.model),
            componentName: e.model.owner.name,
            parentId: e.args.parent ? e.args.parent.id : undefined,
            childIndex: e.args.index
          }
        });

        //notify viewer if this node is a root, but only if it's visual
        if (e.model.getRoots().indexOf(e.args.model) !== -1 && e.args.model.type.allowAsChild) {
          _this.send({
            cmd: 'modelUpdate',
            content: {
              type: 'rootAdded',
              nodeId: e.args.model.id,
              componentName: e.model.owner.name
            }
          });
        }
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.nodeRemoved',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        //Model.connectionRemoved events are sent before nodeRemoved
        //so no need to send affected connections

        if (!e.model.owner) return; //Model is being created, no owner yet. Viewer will use full export
        if (NodeLibrary.instance.typeIsMissing(e.args.model.type)) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'nodeRemoved',
            model: Exporter.exportNode(e.args.model),
            componentName: e.model.owner.name
          }
        });
      },
      this.modelChangesListenerGroup
    );

    function sendComponentPorts(componentModel) {
      const exportPorts = [];

      const ports = componentModel.getPorts();
      for (const i in ports) {
        const p = ports[i];

        // Only export types that are resolved
        if (p.type) exportPorts.push(p);
      }

      _this.send({
        cmd: 'modelUpdate',
        content: {
          type: 'componentPortsUpdated',
          ports: exportPorts,
          componentName: componentModel.name
        }
      });
    }

    EventDispatcher.instance.on(
      'Model.connectionAdded',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (!e.model.owner) return; //Model is being created, no owner yet. Viewer will use full export

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'connectionAdded',
            model: Exporter.exportConnection(e.args.model),
            componentName: e.model.owner.name
          }
        });

        sendComponentPorts(e.model.owner);
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.connectionRemoved',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (!e.model.owner) return; //Model is being created, no owner yet. Viewer will use full export

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'connectionRemoved',
            model: Exporter.exportConnection(e.args.model),
            componentName: e.model.owner.name
          }
        });

        sendComponentPorts(e.model.owner);
      },
      this.modelChangesListenerGroup
    );

    // A connection has changed it's from or to port
    EventDispatcher.instance.on(
      'Model.connectionPortChanged',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (!e.model.owner || !e.model.owner.owner) return; //Model is being created, no owner yet. Viewer will use full export

        const c = e.args.model;

        // First remove the old connection
        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'connectionRemoved',
            model: Exporter.exportConnection({
              fromId: c.fromId,
              fromProperty: e.args.oldFromProperty !== undefined ? e.args.oldFromProperty : c.fromProperty,
              toId: c.toId,
              toProperty: e.args.oldToProperty !== undefined ? e.args.oldToProperty : c.toProperty
            }),
            componentName: e.model.owner.name
          }
        });

        // Then add the new connection
        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'connectionAdded',
            model: Exporter.exportConnection(e.args.model),
            componentName: e.model.owner.name
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.parametersChanged',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (!e.model.owner || !e.model.owner.owner) return; //Model is being created, no owner yet. Viewer will use full export

        const args = e.args || {};

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'parameterChanged',
            nodeId: e.model.id,
            componentName: e.model.owner.owner.name, //Node -> Graph -> Component
            parameterName: args.name, // If only one
            parameterValue: args.value,
            state: args.state, // The state if any

            // This is used if there are many parameters changed at once
            parameters: args.parameters,
            stateParameters: args.stateParameters,
            oldParameters: args.oldParameters,
            oldStateParameters: args.oldStateParameters
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.nodeAttached',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (!e.model.owner) return; //Model is being created, no owner yet. Viewer will use full export

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'nodeAttached',
            nodeId: e.args.model.id,
            parentId: e.args.parent.id,
            childIndex: e.args.index,
            componentName: e.model.owner.name
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.nodeDetached',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (!e.model.owner) return; //Model is being created, no owner yet. Viewer will use full export

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'nodeDetached',
            nodeId: e.args.model.id,
            componentName: e.model.owner.name
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.componentAdded',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (e.args.model.owner === undefined) return; // Not part of component
        if (e.args.model.owner !== ProjectModel.instance) return; // Not part of current project

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'componentAdded',
            model: Exporter.exportComponent(e.args.model)
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.componentRemoved',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'componentRemoved',
            componentName: e.args.model.name
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.rootNodeChanged',
      function (e) {
        if (_this.watchModelChangesDisabled || !e.model) return;

        console.log('root node changed, library exporting...');
        _this.export();
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.portAdded',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'portAdded',
            componentName: e.model.owner.owner.name,
            nodeId: e.args.model.id,
            port: e.args.port
          }
        });

        sendComponentPorts(e.model.owner.owner);
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.portRemoved',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'portRemoved',
            componentName: e.model.owner.owner.name,
            nodeId: e.args.model.id,
            port: e.args.port
          }
        });

        sendComponentPorts(e.model.owner.owner);
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.nodePortRenamed',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'nodePortRenamed',
            componentName: e.model.owner.name,
            nodeId: e.args.model.id,
            port: e.args.port,
            oldName: e.args.oldName
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.instancePortsChanged',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (!e.model.owner.owner) {
          //node isn't assigned to a component yet
          //this can happen during specific cirumstances like the following:
          //1. ComponentModel.fromJSON is called
          //2. If it has navigation nodes the RouterNavigateAdapter will add dynamic ports to them, causing this callback to be called
          //3. Component owner is assigned
          return;
        }

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'instancePortsChanged',
            componentName: e.model.owner.owner.name,
            nodeId: e.model.id,
            ports: Exporter.exportPorts(e.model)
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.metadataChanged',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'componentMetadataChanged',
            componentName: e.model.name,
            key: e.args.key,
            data: e.args.data
          }
        });
      },
      this.modelChangesListenerGroup
    );

    // Variants
    EventDispatcher.instance.on(
      'Model.variantParametersChanged',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        const args = e.args || {};

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'variantParametersChanged',
            variantName: e.model.name,
            variantTypeName: e.model.typename,
            parameterName: args.name, // If only one
            parameterValue: args.value,
            state: args.state,

            // If many parameters, export entire variant
            variant: args.name === undefined ? Exporter.exportVariant(e.model) : undefined
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.variantDeleted',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'variantDeleted',
            variantName: e.args.variant ? e.args.variant.name : undefined,
            variantTypeName: e.args.variant ? e.args.variant.typename : undefined
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.variantChanged',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (!e.model.owner || !e.model.owner.owner) return; //Model is being created, no owner yet. Viewer will use full export

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'variantChanged',
            nodeId: e.model.id,
            componentName: e.model.owner.owner.name, //Node -> Graph -> Component
            variantName: e.args.variant ? e.args.variant.name : undefined
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.variantStateTransitionsChanged',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        const args = e.args || {};

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'variantStateTransitionsChanged',
            variantName: e.model.name,
            variantTypeName: e.model.typename,
            parameterName: args.parameterName, // If only one
            curve: args.curve,
            state: args.state,

            // This is used if there are many parameters changed at once
            stateTransitions: args.stateTransitions,
            defaultStateTransitions: args.defaultStateTransitions,
            oldStateTransitions: args.oldStateTransitons,
            oldDefaultStateTransitions: args.oldDefaultStateTransitions
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.variantRenamed',
      (e) => {
        if (_this.watchModelChangesDisabled) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'variantRenamed',
            oldVariantName: e.args.oldName,
            variantTypeName: e.args.variant.typename,
            variantName: e.args.variant.name
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.variantDefaultStateTransitionChanged',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'variantDefaultStateTransitionChanged',
            variantName: e.model.name,
            variantTypeName: e.model.typename,
            state: e.args.state,
            curve: e.args.curve
          }
        });
      },
      this.modelChangesListenerGroup
    );

    // State transitions
    EventDispatcher.instance.on(
      'Model.stateTransitionsChanged',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (!e.model.owner || !e.model.owner.owner) return; //Model is being created, no owner yet. Viewer will use full export

        const args = e.args || {};

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'stateTransitionsChanged',
            nodeId: e.model.id,
            componentName: e.model.owner.owner.name, //Node -> Graph -> Component
            parameterName: args.parameterName, // If only one
            curve: args.curve,
            state: args.state,

            // This is used if there are many parameters changed at once
            stateTransitions: args.stateTransitions,
            defaultStateTransitions: args.defaultStateTransitions,
            oldStateTransitions: args.oldStateTransitons,
            oldDefaultStateTransitions: args.oldDefaultStateTransitions
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.defaultStateTransitionChanged',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (!e.model.owner || !e.model.owner.owner) return; //Model is being created, no owner yet. Viewer will use full export

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'defaultStateTransitionChanged',
            nodeId: e.model.id,
            componentName: e.model.owner.owner.name, //Node -> Graph -> Component
            state: e.args.state,
            curve: e.args.curve
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'ProjectModel.instanceWillChange',
      () => {
        this.lastExports = {};
        this.registeredRuntimeTypes.clear();

        if (this.watchModelChangesDisabled) return;

        this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'projectInstanceChanged'
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'ProjectModel.metadataChanged',
      ({ key, data }) => {
        if (_this.watchModelChangesDisabled) return;

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'metadataChanged',
            key: key,
            data: data
          }
        });
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'activeComponentChanged',
      ({ component }) => {
        if (component === undefined) return;
        _this.send({
          cmd: 'activeComponentChanged',
          component: component.fullName
        });
      },
      this.modelChangesListenerGroup
    );

    let sendRouterIndexTimeout;

    function sendRouterIndex() {
      if (sendRouterIndexTimeout) return;

      sendRouterIndexTimeout = setTimeout(() => {
        sendRouterIndexTimeout = undefined;

        const allComponents = ProjectModel.instance.getComponents();

        _this.send({
          cmd: 'modelUpdate',
          content: {
            type: 'routerIndexChanged',
            data: Exporter.getRouterIndex(allComponents)
          }
        });
      }, 100);
    }

    EventDispatcher.instance.on(
      ['Model.parametersChanged'],
      (event) => {
        if (_this.watchModelChangesDisabled) return;

        const nodeType = event.model.type.name;
        if (['Router', 'PageInputs', 'Page'].includes(nodeType)) {
          sendRouterIndex();
        }
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.nodeAdded',
      (event) => {
        if (_this.watchModelChangesDisabled) return;

        const nodeType = event.args.model.type;
        if (['Router', 'PageInputs', 'Page'].includes(nodeType)) {
          sendRouterIndex();
        }
      },
      this.modelChangesListenerGroup
    );

    EventDispatcher.instance.on(
      'Model.componentAdded',
      function (e) {
        if (_this.watchModelChangesDisabled) return;

        if (e.args.model.owner === undefined) return; // Not part of component
        if (e.args.model.owner !== ProjectModel.instance) return; // Not part of current project

        let doExport = false;

        e.args.model.forEachNode((node) => {
          if (['Router', 'PageInputs', 'Page'].includes(node.type.name)) {
            doExport = true;
          }
        });

        if (doExport) {
          sendRouterIndex();
        }
      },
      this.modelChangesListenerGroup
    );
  }

  setWatchModelChangesEnabled(enabled) {
    this.watchModelChangesDisabled = !enabled;
  }
}

if (process.env.devMode !== 'test') {
  ViewerConnection.instance = new ViewerConnection();
}
