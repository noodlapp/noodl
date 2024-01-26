import { clipboard, ipcRenderer } from 'electron';
import _ from 'underscore';
import React from 'react';
import ReactDOM from 'react-dom';

import { NodeGraphColors } from '@noodl-constants/NodeGraphColors';
import { AiAssistantEvent, AiAssistantModel } from '@noodl-models/AiAssistant/AiAssistantModel';
import { BasicNodeType } from '@noodl-models/nodelibrary/BasicNodeType';
import { RuntimeType } from '@noodl-models/nodelibrary/NodeLibraryData';
import { SidebarModel } from '@noodl-models/sidebar';
import { SidebarModelEvent } from '@noodl-models/sidebar/sidebarmodel';
import { UndoQueue, UndoActionGroup } from '@noodl-models/undo-queue-model';
import { EditorSettings } from '@noodl-utils/editorsettings';
import { canExtractToComponent, extractToComponent } from '@noodl-utils/ExtractToComponent';
import { KeyCode } from '@noodl-utils/keyboard/KeyCode';
import KeyboardHandler, { KeyboardCommand } from '@noodl-utils/keyboardhandler';
import { Model } from '@noodl-utils/model';
import { getComponentModelRuntimeType } from '@noodl-utils/NodeGraph';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { DialogRenderDirection } from '@noodl-core-ui/components/layout/BaseDialog';
import { MenuDialogWidth } from '@noodl-core-ui/components/popups/MenuDialog';
import { PopupToolbar, PopupToolbarProps } from '@noodl-core-ui/components/popups/PopupToolbar';

import { EventDispatcher } from '../../../shared/utils/EventDispatcher';
import View from '../../../shared/view';
import { ComponentModel } from '../models/componentmodel';
import {
  Connection,
  NodeGraphModel,
  NodeGraphNode,
  NodeGraphNodeJSON,
  NodeGraphNodeSet
} from '../models/nodegraphmodel';
import { NodeLibrary } from '../models/nodelibrary';
import { ProjectModel } from '../models/projectmodel';
import { WarningsModel } from '../models/warningsmodel';
import DebugInspector from '../utils/debuginspector';
import { rectanglesOverlap, guid } from '../utils/utils';
import { ViewerConnection } from '../ViewerConnection';
import CommentLayer from './commentlayer';
import { ConnectionPopup } from './ConnectionPopup';
import { CreateNewNodePanel } from './createnewnodepanel';
import { TitleBar } from './documents/EditorDocument/titlebar';
import { NodeGraphComponentTrail } from './NodeGraphComponentTrail';
import Inspectors from './nodegrapheditor.debuginspectors';
import { canAcceptDrop, onDrop } from './nodegrapheditor.drag';
import MouseWheelModeDetector from './nodegrapheditor/MouseWheelModeDetector';
import { NavigationHistory } from './nodegrapheditor/NavigationHistory';
import { NodeGraphEditorConnection } from './nodegrapheditor/NodeGraphEditorConnection';
import { NodeGraphEditorNode } from './nodegrapheditor/NodeGraphEditorNode';
import PopupLayer from './popuplayer';
import { showContextMenuInPopup } from './ShowContextMenuInPopup';
import { ToastLayer } from './ToastLayer/ToastLayer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NodeGraphEditorTemplate = require('../templates/nodegrapheditor.html');

// Styles
require('../styles/nodegrapheditor.css');

type MouseEventType = 'down' | 'up' | 'move' | 'over' | 'out';
type MousePosition = {
  x: number;
  y: number;
  pageX: number;
  pageY: number;
};
export type IVector2 = {
  x: number;
  y: number;
};

type PanAndScale = {
  scale: number;
  x: number;
  y: number;
};

type AABB = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export enum CenterToFitMode {
  RootNodes,
  AllNodes
}

const SnapSpacing = 8;

type NodeGraphMouseEvent = JQuery.Event & { consumed?: boolean; spaceKey?: boolean };

class Selector {
  private _selected: NodeGraphEditorNode[] = [];

  public get active() {
    return this._selected.length > 0;
  }

  public get nodes(): readonly NodeGraphEditorNode[] {
    return this._selected;
  }

  public isActive(node: NodeGraphEditorNode) {
    return this._selected.indexOf(node) !== -1;
  }

  public select(nodes: NodeGraphEditorNode[]) {
    this._selected = nodes;
  }

  public unselect() {
    //remove selection highlight, if any
    if (this._selected.length === 1) {
      this._selected[0].selected = false;
    }

    this._selected = [];
  }

  public unselectNode(node: NodeGraphEditorNode) {
    const index = this._selected.indexOf(node);
    if (index === -1) {
      return;
    }

    //remove selection highlight, if any
    if (node.selected) {
      node.selected = false;
    }

    this._selected.splice(index, 1);
  }
}

export class NodeGraphEditor extends View {
  el: TSFixme;
  model: NodeGraphModel;
  roots: NodeGraphEditorNode[];
  connections: TSFixme[];
  inspectors: TSFixme[];
  origin: { x: number; y: number };
  navigationHistory: NavigationHistory;

  canvas: {
    desiredWidth: number;
    desiredHeight: number;
    ratio: number;
    width: number;
    height: number;
    ctx: CanvasRenderingContext2D;
  };

  selector = new Selector();

  mouseEventsEnabled: boolean;
  graphAABB: { minX: number; maxX: number; minY: number; maxY: number };
  commentLayer: CommentLayer;
  _disposed: boolean;
  highlighted: NodeGraphEditorNode;
  stateText: string;
  domElementContainer: HTMLDivElement;
  currentLayout: TSFixme;
  clipboard: TSFixme;
  latestMousePos: IVector2;
  topLeftCanvasPos: number[];
  mouseWheelDetector: TSFixme;
  spaceKeyDown: boolean;
  curtop = 0;
  inspectorsModel: DebugInspector.InspectorsModel;
  clearDeleteModeTimer: NodeJS.Timeout;

  draggingNodes: NodeGraphEditorNode[] | null = null;

  lastDraggingMousePos: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };

  startDraggingMousePos: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };

  dragNodesUndoGroup: UndoActionGroup;
  draggingConnection: {
    fromNode: TSFixme;
    toNode?: TSFixme;
    mouseTarget?: TSFixme;
    pos?: TSFixme;
    popupOpen?: TSFixme;
  };
  deleteModeConnection: TSFixme;
  componentName: TSFixme;
  componentFolder: string;
  leftButtonIsDoubleClicked: boolean;
  highlightedConnection: TSFixme;
  lastMultiselected: TSFixme;
  insertLocation: TSFixme;
  multiselectMouseDown: { x: number; y: number };
  multiselectMouseMove: { x: number; y: number };
  lastLeftButtonPressedTime: TSFixme;
  panMouseDown: { x: number; y: number };
  originMouseDown: TSFixme;
  rightClickPos: TSFixme;
  createNewNodePanel: CreateNewNodePanel;
  relayoutNeeded: boolean;
  layoutAndPaintScheduled: boolean;
  activeComponent: ComponentModel;
  panAndScale: PanAndScale;
  showInspectorTimeout: NodeJS.Timeout;

  public runtimeType: RuntimeType = undefined;
  keyboardCommands: KeyboardCommand[];

  homeIcon: HTMLImageElement;
  componentIcon: HTMLImageElement;
  aiAssistantInnerIcon: HTMLImageElement;
  aiAssistantOuterIcon: HTMLImageElement;
  warningIcon: HTMLImageElement;

  readOnly: boolean;

  nodesIdsAnimating: string[];
  isPlayingNodeAnimations: boolean;

  constructor(args) {
    super();

    this.el = args.el;
    this.model = args.model;
    this.roots = [];
    this.connections = [];
    this.inspectors = [];
    this.origin = { x: 0, y: 0 };
    this.navigationHistory = new NavigationHistory({ owner: this });
    // this.breadcrumbs = [];
    this.canvas = {
      desiredWidth: 100,
      desiredHeight: 100,
      ratio: NaN,
      width: NaN,
      height: NaN,
      ctx: undefined
    };

    this.mouseEventsEnabled = true;

    this.graphAABB = {
      minX: Number.MAX_VALUE,
      maxX: -Number.MAX_VALUE,
      minY: Number.MAX_VALUE,
      maxY: -Number.MAX_VALUE
    };

    EventDispatcher.instance.on(
      ['DebugInspectorConnectionPulseChanged'],
      () => {
        this.repaint();
      },
      this
    );

    EventDispatcher.instance.on(
      'ProjectModel.instanceHasChanged',
      (args) => {
        args.oldInstance && args.oldInstance.off(this);
        if (ProjectModel.instance === undefined) return;

        this.bindProjectModel();
        this.navigationHistory.discardInvalidEntries();
      },
      this
    );

    if (import.meta.webpackHot) {
      import.meta.webpackHot.accept('./createnewnodepanel');
    }

    this.keyboardCommands = [
      {
        handler: () => this.setSpaceKeyDown(true),
        keybinding: KeyCode.Space,
        type: 'down'
      },
      {
        handler: () => this.setSpaceKeyDown(false),
        keybinding: KeyCode.Space,
        type: 'up'
      },
      {
        handler: () => {
          for (const node of this.selector.nodes) {
            this.nudgeNode(node, node.x + SnapSpacing, node.y);
          }
        },
        keybinding: KeyCode.RightArrow,
        type: 'down'
      },
      {
        handler: () => {
          for (const node of this.selector.nodes) {
            this.nudgeNode(node, node.x - SnapSpacing, node.y);
          }
        },
        keybinding: KeyCode.LeftArrow,
        type: 'down'
      },
      {
        handler: () => {
          for (const node of this.selector.nodes) {
            this.nudgeNode(node, node.x, node.y - SnapSpacing);
          }
        },
        keybinding: KeyCode.UpArrow,
        type: 'down'
      },
      {
        handler: () => {
          for (const node of this.selector.nodes) {
            this.nudgeNode(node, node.x, node.y + SnapSpacing);
          }
        },
        keybinding: KeyCode.DownArrow,
        type: 'down'
      }
    ];

    KeyboardHandler.instance.registerCommands(this.keyboardCommands);

    this.homeIcon = new Image();
    this.homeIcon.src = '../assets/icons/core-ui-temp/home--nodegraph.svg';
    this.homeIcon.onload = () => this.repaint();

    this.componentIcon = new Image();
    this.componentIcon.src = '../assets/icons/core-ui-temp/component--nodegraph.svg';
    this.componentIcon.onload = () => this.repaint();

    this.aiAssistantInnerIcon = new Image();
    this.aiAssistantInnerIcon.src = '../assets/icons/core-ui-temp/aiAssistant--nodegraph-inner.svg';
    this.aiAssistantInnerIcon.onload = () => this.repaint();

    this.aiAssistantOuterIcon = new Image();
    this.aiAssistantOuterIcon.src = '../assets/icons/core-ui-temp/aiAssistant--nodegraph-outer.svg';
    this.aiAssistantOuterIcon.onload = () => this.repaint();

    this.warningIcon = new Image();
    this.warningIcon.src = '../assets/icons/core-ui-temp/warning_triangle.svg';
    this.warningIcon.onload = () => this.repaint();

    SidebarModel.instance.on(
      SidebarModelEvent.activeChanged,
      (activeId) => {
        const isNodePanel = activeId === 'PropertyEditor' || activeId === 'PortEditor';
        if (isNodePanel === false) {
          //deselect nodes when switching away from property editor or port editor
          this.deselect({ disableHidePanels: true });
          this.repaint();
        }
      },
      this
    );
  }

  dispose() {
    AiAssistantModel.instance.off(this);
    KeyboardHandler.instance.deregisterCommands(this.keyboardCommands);

    EventDispatcher.instance.off(this);
    NodeLibrary.instance.off(this);
    ProjectModel.instance && ProjectModel.instance.off(this);
    WarningsModel.instance.off(this);

    this.inspectorsModel?.off(this);

    this.commentLayer && this.commentLayer.dispose();

    SidebarModel.instance.off(this);

    this.reset();

    this._disposed = true;
  }

  setReadOnly(readOnly: boolean) {
    this.readOnly = readOnly;
    this.commentLayer?.setReadOnly(readOnly);
  }

  reset() {
    this.clearSelection({ disableHidePanels: true });
    this.highlighted && ViewerConnection.instance.sendNodeHighlighted(this.highlighted.model, false);
    this.highlighted = undefined; // This is not cleared in clearSelection

    // Delete existing nodes and connections
    while (this.roots.length > 0) {
      const root = this.roots[0];
      this.removeRoot(root);
      root.destruct();
    }

    // Remove all connections
    while (this.connections.length > 0) {
      const con = this.connections[0];
      con.disconnect(con);
    }

    // Remove all debug inspectors
    while (this.inspectors.length > 0) {
      this.removeInspector(this.inspectors[0]);
    }

    if (this.model) {
      // Unbind from current model
      this.model.off(this);
      this.model.commentsModel.off(this);
      for (const i in this.model.roots) {
        this.model.roots[i].forEach((model) => {
          this.unbindNodeModel(model);
        });
      }
    }
  }

  bindModel(model?: NodeGraphModel) {
    const _this = this;

    this.reset();

    this.model = model;
    this.stateText = this.readOnly ? 'Read Only' : null;
    this.updateTitle();
    if (!model) return;

    // Create views for the content of the model
    this.roots = [];
    for (const i in model.roots) {
      const node = NodeGraphEditorNode.createFromModel(model.roots[i], this);

      model.roots[i].forEach(function (model) {
        _this.bindNodeModel(model);
      });

      this.roots.push(node);
    }

    this.connections = [];
    for (const i in model.connections) {
      NodeGraphEditorConnection.createFromModel(model.connections[i], this);
    }

    // Listen to when a node is attached in the model and
    // change the view accordingly
    model.on(
      'nodeAdded',
      function (args) {
        const node = NodeGraphEditorNode.createFromModel(args.model, _this);
        _this.bindNodeModel(args.model);

        if (args.model.parent) {
          const parent = _this.findNodeWithId(args.model.parent.id);
          const index = args.model.parent.children.indexOf(args.model);
          parent.insertChild(node, index);
        } else {
          _this.roots.push(node);
        }

        if (!args?.disableSelect) {
          _this.clearSelection();

          //let the event loop do one tick before selecting, there might be other listeners that want to modify some paramters (like the router adapter)
          setTimeout(() => {
            if (_this.selector.active) {
              return;
            }
            _this.selectNode(node);
            _this.relayout();
            _this.repaint();
          }, 1);
        } else {
          _this.relayout();
          _this.repaint();
        }
      },
      this
    );

    model.commentsModel.on(
      'commentAdded',
      ({ comment, args }) => {
        this.clearSelection();

        if (args && args.focusComment) {
          this.commentLayer && this.commentLayer.focusComment(comment.id);
        }
      },
      this
    );

    model.on(
      'nodeRemoved',
      (args) => {
        const node = this.findNodeWithId(args.model.id);
        if (!node) return; // The node was not found

        // If the highlighted node is delete empty the reference
        if (this.highlighted === node) {
          this.highlighted && ViewerConnection.instance.sendNodeHighlighted(this.highlighted.model, false);
          this.highlighted = undefined;
        }

        //de-select in case it's active
        this.selector.unselectNode(node);

        const inspector = this.getInspectorForNode(node);
        inspector && inspector.remove();

        this.unbindNodeModel(args.model);

        if (node.parent) {
          node.parent.removeChild(node);
          node.destruct();
        } else {
          this.removeRoot(node);
          node.destruct();
        }

        this.clearSelection();
        this.relayout();
        this.repaint();

        if (!this.selector.active) {
          this.updateNodeToolbar();
        }
      },
      this
    );

    model.on(
      'nodeAttached',
      function (args) {
        const node = _this.findNodeWithId(args.model.id);
        const parent = _this.findNodeWithId(args.parent.id);
        parent.insertChild(node, args.index);
        _this.removeRoot(node);

        _this.relayout();
        _this.repaint();
      },
      this
    );

    // Listen to when a node is detached in the model
    model.on(
      'nodeDetached',
      function (args) {
        const node = _this.findNodeWithId(args.model.id);
        node && node.detach();
        _this.roots.push(node);

        _this.relayout();
        _this.repaint();
      },
      this
    );

    // Connections
    model.on(
      'connectionAdded',
      function (args) {
        NodeGraphEditorConnection.createFromModel(args.model, _this, _this.canvas.ctx);

        _this.relayout();
        _this.repaint();
      },
      this
    );

    model.on(
      'connectionRemoved',
      function (args) {
        const con = _this.findConnectionWithModel(args.model);
        con && con.disconnect();

        const inspector = _this.getInspectorForConnection(con);
        inspector && inspector.remove();

        _this.relayout();
        _this.repaint();
      },
      this
    );

    model.on(
      'connectionPortChanged',
      function (args) {
        const con = _this.findConnectionWithModel(args.model);
        con.fromProperty = args.model.fromProperty;
        con.toProperty = args.model.toProperty;

        con.resolvePorts();

        _this.relayout();
        _this.repaint();
      },
      this
    );

    this.layout();
    this.paint();

    // Bind connection inspector and models after the first paint so they know what x and y position to attach to
    this.bindDebugInspector();
  }

  bindNodeModel(model) {
    const _this = this;

    model.on(
      ['labelChanged', 'portRearranged', 'typeRenamed'],
      function () {
        _this.relayout();
        _this.repaint();
      },
      this
    );
  }

  unbindNodeModel(model) {
    model.off(this);
  }

  bindDebugInspector() {
    const _this = this;

    // Add inspector views
    function createConnectionInspector(model) {
      const connection = _this.findConnectionWithKey(model.connectionKey);
      if (connection && connection.isHealthy()) {
        // Is this a connection in this graph
        return new Inspectors.ConnectionInspector({
          model,
          connection,
          owner: _this,
          parentElement: _this.domElementContainer
        });
      }
    }

    function createNodeInspector(model) {
      const node = _this.findNodeWithId(model.nodeId);
      if (node) {
        return new Inspectors.NodeInspector({
          model,
          node,
          owner: _this,
          parentElement: _this.domElementContainer
        });
      }
    }

    function createInspector(model) {
      if (model.type === 'connection') {
        return createConnectionInspector(model);
      } else {
        return createNodeInspector(model);
      }
    }

    const inspectorsModel = DebugInspector.InspectorsModel.instanceForProject(ProjectModel.instance);
    this.inspectorsModel = inspectorsModel;
    inspectorsModel.getInspectors().forEach((model) => {
      const inspector = createInspector(model);
      if (inspector) {
        this.inspectors.push(inspector);
        inspector.render();
      }
    });

    inspectorsModel.off(this);
    inspectorsModel.on(
      'inspectorAdded',
      (args) => {
        const inspector = createInspector(args.model);
        if (inspector) {
          this.inspectors.push(inspector);
          inspector.render();
        }
      },
      this
    );

    inspectorsModel.on(
      'inspectorRemoved',
      (args) => {
        const inspector = this.findInspectorWithModel(args.model);
        this.removeInspector(inspector);
      },
      this
    );
  }

  bindProjectModel() {
    const _this = this;

    ProjectModel.instance.on(
      'componentRemoved',
      (e) => {
        _this.navigationHistory.onComponentRemoved(e.model);
      },
      this
    );

    ProjectModel.instance.on(
      'componentRenamed',
      (e) => {
        _this.updateTitle();
      },
      this
    );
  }

  //A request animation frame timer that renders the entire node graph while there are animations to play
  //TODO: only render when an animated node is visible
  startNodeAnimations() {
    if (this.isPlayingNodeAnimations) {
      return;
    }

    this.isPlayingNodeAnimations = true;

    const animate = () => {
      this.paint();

      if (this.isPlayingNodeAnimations) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  stopNodeAnimations() {
    this.isPlayingNodeAnimations = false;
  }

  render() {
    const _this = this;

    this.el = this.bindView($(NodeGraphEditorTemplate), this);

    this.domElementContainer = this.el.find('#nodegraph-dom-layer').get(0);
    this.commentLayer = new CommentLayer(this);
    this.commentLayer.setReadOnly(this.readOnly);

    // Bind canvas
    this.bindCanvas();

    // Bind model
    this.bindModel(this.model);

    this.bindProjectModel();

    //bind ai assistant
    AiAssistantModel.instance.on(
      AiAssistantEvent.ProcessingUpdated,
      () => {
        AiAssistantModel.instance.getProcessingNodeIds().length
          ? this.startNodeAnimations()
          : this.stopNodeAnimations();
      },
      this
    );

    // Rerender if warnings model changed
    WarningsModel.instance.on(
      'warningsChanged',
      function () {
        _this.repaint();
      },
      this
    );

    // When the node library is changed we may need to rerender
    NodeLibrary.instance.on(
      ['moduleRegistered', 'moduleUnregistered', 'typeAdded', 'typeRemoved', 'libraryUpdated'],
      function () {
        // We must re-resolve ports as they could have changed
        _.each(_this.connections, function (c) {
          c.resolvePorts();
        });

        // Relayout and paint
        _this.relayout();
        _this.repaint();
      },
      this
    );

    // May change warning status
    EventDispatcher.instance.on(
      ['Model.portAdded', 'Model.portRemoved'],
      function () {
        _this.relayout();
        _this.repaint();
      },
      this
    );

    // The module for the graph we are editing has been unregistered
    NodeLibrary.instance.on(
      'moduleUnregistered',
      function (args) {
        if (_this.model && args.model === _this.model.owner.owner) {
          _this.switchToComponent();
        }
      },
      this
    );

    // The component we are editing has been removed
    NodeLibrary.instance.on(
      'typeRemoved',
      function (args) {
        if (_this.model && args.model === _this.model.owner) {
          _this.switchToComponent();
        }
      },
      this
    );

    //the comment layer is using react-dnd which caches the parent position the first time a comment is rendered.
    //it's crucial that the parent position is correct, so delay the rendering a tick so all the DOM elements are in the right place
    setTimeout(() => {
      this.commentLayer.renderTo(this.el.find('#comment-layer-bg').get(0), this.el.find('#comment-layer-fg').get(0));
    }, 1);

    this.relayout();
    this.repaint();

    return this.el;
  }

  // This is called by the parent view (frames view) when the size and position
  // changes
  resize(layout) {
    this.currentLayout = layout;

    //make sure the canvas is bound and rendering happens at the same frame, otherwise it'll flicker
    this.bindCanvas();
    this.layout();
    this.paint();

    if (this.model && this.canvas.width && this.canvas.height) {
      let panAndScale = this.getPanAndScale();
      panAndScale = this.clampPanAndScale(panAndScale);
      this.setPanAndScale(panAndScale);
    }
  }

  // --------------------------------- Cut n paste ------------------------------------------
  getSelectedNodes(): NodeGraphEditorNode[] {
    return [...this.selector.nodes];
  }

  copySelected() {
    const nodes = this.selector.nodes;

    // Make sure all nodes can be copied
    const _invalid = nodes.filter((n) => !n.model.canBeCopied());
    if (_invalid.length !== 0) {
      ToastLayer.showError('One or more of these nodes cannot be copied.');
      return;
    }

    // Update coordinates so they are pasted correctly
    const nodeModels = nodes.map((n) => {
      n.x = n.global.x;
      n.y = n.global.y;
      n.updateModel();
      return n.model;
    });

    const nodeset = this.model.getNodeSetWithNodes(nodeModels);
    nodeset.comments = this.commentLayer.getSelectedComments();

    if (nodes.length > 0 || nodeset.comments.length > 0) {
      this.clipboard = nodeset.clone();
      this.clipboard.strip();
      clipboard.writeText(JSON.stringify(this.clipboard.toJSON()));
    } else {
      this.clipboard = undefined;
    }

    ToastLayer.showInteraction('Copied');

    return nodeset;
  }

  delete() {
    if (this.readOnly) {
      return false;
    }

    const nodes = [...this.selector.nodes];

    // Make sure all nodes can be deleted
    const _invalid = nodes.filter((n) => !n.model.canBeDeleted());
    if (_invalid.length !== 0) {
      ToastLayer.showError('One or more of these nodes cannot be deleted.');
      return;
    }

    const undo = new UndoActionGroup({ label: 'delete nodes' });

    if (this.commentLayer && this.commentLayer.hasSelection()) {
      this.commentLayer.deleteSelection({ undo: undo });
    }

    const models = _.pluck(nodes, 'model');
    this.model.removeNodeSet(this.model.getNodeSetWithNodes(models), {
      undo: undo
    });

    UndoQueue.instance.push(undo);
  }

  copy() {
    this.copySelected();
  }

  cut() {
    if (this.readOnly) {
      return false;
    }

    const nodeset = this.copySelected();
    if (nodeset === undefined) return;

    const undoCut = new UndoActionGroup({ label: 'cut' });
    this.model.removeNodeSet(nodeset, { undo: undoCut });
    UndoQueue.instance.push(undoCut);

    ToastLayer.showInteraction('Cut');
  }

  getNodeSetFromClipboard() {
    try {
      const text = clipboard.readText();
      if (!text) return;

      var json = JSON.parse(text);
    } catch (e) {
      // Failed to parse clipboard text as json
      return;
    }

    return NodeGraphNodeSet.fromJSON(json);
  }

  insertNodeSet({
    nodeset,
    x,
    y,
    toastMessage
  }: {
    nodeset: NodeGraphNodeSet;
    x: number;
    y: number;
    toastMessage: string;
  }): NodeGraphNodeSet | null {
    if (this.readOnly) {
      return null;
    }

    const ns = nodeset.clone();

    // Check create status for all node types
    const component = this.model.owner;
    const errors: string[] = [];

    const _this = this;
    function checkCreateStatus(nodes: NodeGraphNodeSet['nodes']) {
      for (const node of nodes) {
        if (node.type instanceof ComponentModel) {
          const status = component.getCreateStatus({
            type: node.type
          });

          if (!status.creatable) {
            errors.push(status.message);
          }
        } else if (node.type instanceof BasicNodeType) {
          if (node.type.runtimeTypes && !node.type.runtimeTypes.includes(_this.runtimeType)) {
            errors.push('One or more of these nodes cannot be created here.');
          }
        }

        checkCreateStatus(node.children);
      }
    }

    checkCreateStatus(ns.nodes);

    if (errors.length > 0) {
      // There were create errors
      const msg = {};
      for (let j = 0; j < errors.length; j++) {
        msg[errors[j]] = true;
      }
      let _msg = '';
      for (const i in msg) {
        _msg += i;
      }
      ToastLayer.showError(_msg);
      return;
    }

    ns.setOriginPosition({ x, y });

    const undoNodeSet = new UndoActionGroup({ label: 'paste' });
    this.model.insertNodeSet(ns, { undo: undoNodeSet });
    undoNodeSet.push({
      undo: () => {
        this.clearSelection();
        this.commentLayer.clearSelection();
      }
    });
    UndoQueue.instance.push(undoNodeSet);

    // Select all nodes
    const multiselected = [];
    for (const i in ns.nodes) {
      const model = ns.nodes[i];
      model.forEach((m) => {
        multiselected.push(this.findNodeWithId(m.id));
      });
    }

    this.selector.select(multiselected);

    //and comments
    if (ns.comments) {
      this.commentLayer.setSelectedCommentIds(ns.comments.map((c) => c.id));
    }

    this.layout();
    this.updateNodeToolbar();
    this.repaint();

    ToastLayer.showInteraction(toastMessage);

    return ns;
  }

  paste() {
    const ns = this.getNodeSetFromClipboard() || this.clipboard;
    if (!ns) return;

    this.insertNodeSet({
      nodeset: ns,
      x: this.latestMousePos.x,
      y: this.latestMousePos.y,
      toastMessage: 'Paste'
    });
  }

  // --------------------------------- Undo n redo ------------------------------------------
  undo() {
    if (this.readOnly) {
      return false;
    }

    const action = UndoQueue.instance.undo();
    if (action) {
      ToastLayer.showInteraction('Undo ' + action.label);
    } else {
      ToastLayer.showInteraction('Nothing to undo');
    }
  }

  redo() {
    if (this.readOnly) {
      return false;
    }

    const action = UndoQueue.instance.redo();
    if (action) {
      ToastLayer.showInteraction('Redo ' + action.label);
    } else {
      ToastLayer.showInteraction('Nothing to redo');
    }
  }

  getDevicePixelRatio(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const bsr =
      ctx.webkitBackingStorePixelRatio ||
      ctx.mozBackingStorePixelRatio ||
      ctx.msBackingStorePixelRatio ||
      ctx.oBackingStorePixelRatio ||
      ctx.backingStorePixelRatio ||
      1;
    const r = dpr / bsr;
    return r;
  }

  bindCanvas() {
    const _this = this;

    const canvas = this.$('#nodegraphcanvas')[0];
    const ctx = (this.canvas.ctx = canvas.getContext('2d', { alpha: true }));

    // Support retina display
    this.canvas.ratio = this.getDevicePixelRatio(ctx);

    const width = $(canvas).width();
    const height = $(canvas).height();

    canvas.width = width * this.canvas.ratio;
    canvas.height = height * this.canvas.ratio;

    this.canvas.width = canvas.width;
    this.canvas.height = canvas.height;

    // Bind mouse events
    const topLeft = function (canvas: HTMLCanvasElement) {
      const { x, y } = canvas.getBoundingClientRect();
      return [x, y];
    };

    this.topLeftCanvasPos = topLeft(canvas);

    const events = {
      mousedown: 'down',
      mouseup: 'up',
      mousemove: 'move',
      mouseout: 'out',
      mouseover: 'over'
    };

    for (const i in events) {
      const type = events[i];
      $(canvas)
        .off(i)
        .on(i, (evt) => {
          // @ts-expect-error
          evt.spaceKey = _this.spaceKeyDown; // This is set by the KeyboardHandler
          this.mouse(
            type,
            {
              x: evt.pageX - this.topLeftCanvasPos[0],
              y: evt.pageY - this.topLeftCanvasPos[1],
              pageX: evt.pageX,
              pageY: evt.pageY
            },
            evt
          );
        });

      $(canvas).on('mouseover', (evt) => {
        this.topLeftCanvasPos = topLeft(canvas);
      });
    }

    this.mouseWheelDetector = new MouseWheelModeDetector();

    $(canvas)
      .off('wheel')
      .on('wheel', (e) => {
        this.handleMouseWheelEvent(e.originalEvent);
      });
  }

  setSpaceKeyDown(pressed) {
    if (this.spaceKeyDown === pressed) {
      return;
    }

    this.spaceKeyDown = pressed;
    this.canvas.ctx.canvas.style.cursor = pressed ? 'grab' : 'inherit';
  }

  handleMouseWheelEvent(event, args?) {
    event.preventDefault();

    const pointerDeviceType = this.mouseWheelDetector.changeMode(event);

    if (pointerDeviceType === 'mouse' || event.ctrlKey || event.metaKey) {
      const zoomFactor = pointerDeviceType === 'mouse' ? 1 / 100 : 1 / 10;

      //this function can be called by the comment layer (when a mousewheel event is fired on a comment DOM node)
      //this will send it's own offsets that should override the event offset
      const offsetX = args && args.hasOwnProperty('offsetX') ? args.offsetX : event.offsetX;
      const offsetY = args && args.hasOwnProperty('offsetY') ? args.offsetY : event.offsetY;

      this.updateZoomLevel(offsetX, offsetY, -event.deltaY * zoomFactor);
    } else {
      // Move all roots and relayout
      const panAndScale = this.getPanAndScale();
      const scale = panAndScale.scale;

      this.moveRoots(-event.deltaX / scale, -event.deltaY / scale);
      this.relayout();
      this.repaint();
    }
  }

  updateZoomLevel(x, y, deltaZ) {
    let panAndScale = this.getPanAndScale();
    const oldScale = panAndScale.scale;

    //Scale by multiplying with a factor to make zooming linear
    // (e.g. 0.5->0.6 is 20% increase, 1.0 -> 1.1 is only 10%)
    let scale = oldScale * Math.pow(0.95, -deltaZ);

    //Restrict scaling to max 1, and minimum so you can see the entire component plus some padding OR 0.33 (to always allow some zoom)
    const graphAABB = this.graphAABB;

    const canvasWidth = this.canvas.width / this.canvas.ratio;
    const canvasHeight = this.canvas.height / this.canvas.ratio;

    const ScalePadding = 200;

    const minXScale = canvasWidth / (graphAABB.maxX - graphAABB.minX + 2 * ScalePadding);
    const minYScale = canvasHeight / (graphAABB.maxY - graphAABB.minY + 2 * ScalePadding);
    const minScale = Math.min(minXScale, minYScale, 0.33);
    scale = Math.max(minScale, Math.min(1, scale));

    //apply scaling
    panAndScale = {
      scale: scale,
      x: panAndScale.x + (x / scale - x / oldScale),
      y: panAndScale.y + (y / scale - y / oldScale)
    };
    panAndScale = this.clampPanAndScale(panAndScale);
    this.setPanAndScale(panAndScale);

    this.relayout();
    this.repaint();
  }

  forEachNode(callback) {
    for (const i in this.roots) {
      if (this.roots[i].forEach(callback)) return;
    }
  }

  addNodeToSelection(node: NodeGraphEditorNode) {
    if (this.readOnly) {
      return;
    }

    const currentMultiselect = [...this.selector.nodes];

    this.deselect();

    const index = currentMultiselect.indexOf(node);
    if (index === -1) {
      currentMultiselect.push(node);
    } else {
      currentMultiselect.splice(index, 1);
    }

    this.selector.select(currentMultiselect);

    this.repaint();
  }

  startDraggingNode(node: NodeGraphEditorNode) {
    if (this.readOnly) {
      return;
    }

    if (!this.draggingNodes) {
      // Collect all highlighted/selected nodes that are roots in the selection
      let selected = [];
      if (this.selector.isActive(node)) {
        selected = [...this.selector.nodes];
      } else {
        this.selector.unselect();
        this.commentLayer?.clearSelection();
        selected = [node];
      }

      const nodes = [];

      //add the roots
      for (const i in selected) {
        const n = selected[i];
        if (!n.parent || selected.indexOf(n.parent) === -1) {
          nodes.push(n);
        }
      }

      this.startDraggingNodes(nodes);
    }
  }

  setDOMLayerVisible(visible) {
    this.domElementContainer.style.display = visible ? '' : 'none';

    if (visible) {
      for (const inspector of this.inspectors) {
        inspector.render();
      }
    }
  }

  startDraggingNodes(nodes) {
    this.draggingNodes = nodes || [];

    this.setDOMLayerVisible(false);

    this.lastDraggingMousePos = this.startDraggingMousePos = this.latestMousePos;

    this.dragNodesUndoGroup = new UndoActionGroup({
      label: 'drag nodes'
    });
  }

  startDraggingConnection(fromNode) {
    if (this.readOnly) {
      return false;
    }

    // Clear multiselect
    this.selector.unselect();

    this.setDOMLayerVisible(false);

    this.highlighted && ViewerConnection.instance.sendNodeHighlighted(this.highlighted.model, false);
    this.highlighted = undefined; // Clear highlighted

    this.draggingConnection = { fromNode: fromNode };

    this.draggingConnection.mouseTarget = {
      global: {
        x: this.latestMousePos.x,
        y: this.latestMousePos.y
      }
    };
  }

  removeRoot(node) {
    const idx = this.roots.indexOf(node);
    idx !== -1 && this.roots.splice(idx, 1);
  }

  moveRoots(dx, dy) {
    let panAndScale = this.getPanAndScale();
    panAndScale.x += dx;
    panAndScale.y += dy;
    panAndScale = this.clampPanAndScale(panAndScale);
    this.setPanAndScale(panAndScale);

    /* for(var i in this.roots) {
      this.roots[i].x += dx;
      this.roots[i].y += dy;

      this.roots[i].updateModel();
    }*/
  }

  createNewNode(type: ComponentModel, pos: IVector2, options: Partial<NodeGraphNodeJSON> = {}) {
    const node = NodeGraphNode.fromJSON({
      type: type.name,
      x: pos.x,
      y: pos.y,
      id: guid(),
      ...options
    });

    if (this.highlighted) {
      this.highlighted.model.addChild(node, { undo: true, label: 'create' });
    } else {
      this.model.addRoot(node, { undo: true, label: 'create' });
    }

    this.clearSelection();
    this.relayout();
    this.repaint();
  }

  deselect(args?: { disableHidePanels: boolean }) {
    this.commentLayer?.clearMultiselection();
    this.selector.unselect();

    if (!args?.disableHidePanels) {
      SidebarModel.instance?.hidePanels();
    }

    // Broadcast a deselect event
    this.notifyListeners('deselect');
  }

  clearSelection(args?: { disableHidePanels: boolean }) {
    this.deselect(args);

    // Clear dragging connection
    if (this.draggingConnection) {
      this.closeConnectionPanels();
      this.draggingConnection.fromNode.borderHighlighted = false;
      this.draggingConnection.toNode.borderHighlighted = false;
      this.draggingConnection = undefined;
    }

    // Clear any connections that are being deleted
    this.setHighlightedConnection(undefined);
    this.deleteModeConnection = undefined;

    // Close open popup
    PopupLayer.instance.hideAllModalsAndPopups();
    PopupLayer.instance.hideTooltip();
  }

  updateTitle() {
    const root = this.el[0].querySelector('.nodegraph-component-trail-root');

    if (this.activeComponent) {
      const fullName = this.activeComponent.fullName;
      const nameParts = fullName.split('/');
      const firstItem = nameParts.shift();
      const componentTrail = [];

      for (let i = 0; i < nameParts.length; i++) {
        let part = '';

        for (let j = 0; j <= i; j++) {
          part += '/' + nameParts[j];
        }

        componentTrail.push({
          name: nameParts[i],
          fullName: part,
          stateText: this.stateText,
          // TODO: this returns undefined if the component is a folder,
          // but if a folder and a component has the same name the result
          // of this check will be wrong. i think this is a rare edge case though
          component: ProjectModel.instance.getComponentWithName(part),
          isCurrent: i === nameParts.length - 1,
          isFolderComponent: nameParts.length > 1 && !fullName.endsWith(part)
        });
      }

      const componentName = nameParts.pop();
      this.componentName = componentName;

      if (nameParts.length) {
        this.componentFolder = nameParts.join(' / ') + ' /';
      } else {
        this.componentFolder = '';
      }

      const props = {
        componentTrail,
        onSwitchToComponent: this.switchToComponent.bind(this),
        onHistoryForward: this.navigationHistory.goForward.bind(this.navigationHistory),
        onHistoryBack: this.navigationHistory.goBack.bind(this.navigationHistory),
        canNavigateBack: this.navigationHistory.canNavigateBack,
        canNavigateForward: this.navigationHistory.canNavigateForward
      };

      ReactDOM.render(React.createElement(NodeGraphComponentTrail, props), root);
    } else {
      ReactDOM.unmountComponentAtNode(root);
    }
  }

  switchToComponent(
    component?: ComponentModel,
    args?: {
      node?: NodeGraphNode;
      pushHistory?: boolean;
      replaceHistory?: boolean;
    }
  ) {
    if (!component) {
      this.activeComponent?.off(this);
      this.activeComponent = undefined;
      this.runtimeType = undefined;
      this.updateTitle();
      this.bindModel();

      this.relayout();
      this.repaint();

      this.commentLayer.setComponentModel(undefined);

      return;
    }

    // Update the runtime type, this is required for the node picker
    this.runtimeType = getComponentModelRuntimeType(component);

    if (this.activeComponent !== component) {
      this.activeComponent?.off(this);

      this.activeComponent = component;

      if (args?.replaceHistory) {
        this.navigationHistory.reset();
        this.navigationHistory.push(component);
      } else if (args?.pushHistory) {
        this.navigationHistory.push(component);
      }

      TitleBar.instance.getWarningsAmount(component);
      this.bindModel(component.graph);

      this.commentLayer.setComponentModel(component);

      //If the components graph model is changed, rebind the new model
      //Can be triggered when a user reset a component in the git panel
      component.on(
        'graphModelBound',
        () => {
          this.bindModel(component.graph);
        },
        this
      );

      EventDispatcher.instance.emit('activeComponentChanged', { component });
    }

    this.notifyListeners('activeComponentChanged', {
      model: component,
      args: args
    });

    // Should we select a node
    this.panAndScale = undefined;
    if (args?.node) {
      const node = this.findNodeWithId(args.node.id);
      if (node) {
        this.clearSelection();
        this.selectNode(node);

        this.relayout(); // Need to relayout twice the first time a new model is set...
        this.layout();

        const panAndScale = this.getPanAndScale();
        this.moveRoots(
          -panAndScale.x + this.currentLayout.width / 2 / panAndScale.scale - node.global.x - node.nodeSize.width / 2,
          -panAndScale.y + this.currentLayout.height / 2 / panAndScale.scale - node.global.y - node.nodeSize.height / 2
        );
      }
    }

    this.relayout(); // Need to relayout twice the first time a new model is set...
    this.layout();
    this.repaint();
  }

  getActiveComponent(): ComponentModel {
    return this.activeComponent;
  }

  selectNode(node: NodeGraphEditorNode) {
    if (this.readOnly) {
      this.notifyListeners('readOnlyNodeClicked', node.model);
      return;
    }

    if (!node.selected) {
      // Select node
      this.clearSelection();
      this.commentLayer?.clearSelection();
      node.selected = true;
      this.selector.select([node]);
      SidebarModel.instance.switchToNode(node.model);

      this.repaint();
    } else {
      // Double selection
      if (node.model.type instanceof ComponentModel) {
        this.switchToComponent(node.model.type, { pushHistory: true });
      } else {
        const componentPorts = node.model
          .getPorts()
          .filter((p) => p.plug === 'input' && NodeLibrary.nameForPortType(p.type) === 'component');

        //check if there's a type with the component name, if so switch to it
        const component = componentPorts.map((port) => node.model.parameters[port.name]).filter((c) => c !== undefined);
        const type = component.length && NodeLibrary.instance.getNodeTypeWithName(component[0]);

        if (type) {
          // @ts-expect-error TODO: this is wrong!
          this.switchToComponent(type, { pushHistory: true });
        } else if (this.leftButtonIsDoubleClicked) {
          //there was no type that matched, so forward the double click event to the sidebar
          SidebarModel.instance.invokeActive('doubleClick', node);
        }
      }
    }
  }

  setHighlightedNode(node: NodeGraphEditorNode, atPosition?) {
    // Node inspector
    if (this.model && !this.readOnly) {
      // Don't show node inspection in read only mode
      clearTimeout(this.showInspectorTimeout);
      if (node) {
        // We have a new node selected, show inspector
        if (!this.getInspectorForNode(node)) {
          this.showInspectorTimeout = setTimeout(() => {
            this.hideInspectors();

            //and add new inspector
            DebugInspector.InspectorsModel.instanceForProject(ProjectModel.instance).addInspectorForNode({
              node: node.model,
              position: atPosition
            });
          }, 200);
        }
      }
    }

    this.highlighted = node;
  }

  setHighlightedConnection(c: NodeGraphEditorConnection, atPosition?) {
    // Don't show connection inspection in read only mode
    if (this.readOnly) {
      return false;
    }

    // Connection inspector
    clearTimeout(this.showInspectorTimeout);
    if (c) {
      // We have a new connection selected, show inspector
      if (c.isHealthy() && !this.getInspectorForConnection(c)) {
        this.showInspectorTimeout = setTimeout(() => {
          this.hideInspectors();

          DebugInspector.InspectorsModel.instanceForProject(ProjectModel.instance).addInspectorForConnection({
            connection: c.model,
            position: c.findClosestPointOnCurve(atPosition)
          });
        }, 200);
      }
    }

    this.highlightedConnection = c;
  }

  //hide all other inspectors that aren't pinned
  hideInspectors() {
    const inspectorsToRemove = this.inspectors.filter((inspector) => !inspector.isPinned());
    for (const inspector of inspectorsToRemove) {
      inspector.remove();
    }
  }

  getInspectorForConnection(c) {
    return this.inspectors.find((p) => p.connection === c);
  }

  getInspectorForNode(node) {
    return this.inspectors.find((p) => p.node === node);
  }

  removeInspector(inspector) {
    const idx = this.inspectors.indexOf(inspector);
    if (idx !== -1) {
      inspector.dispose();
      this.inspectors.splice(idx, 1);
    }
  }

  isPointInsideNodes(pos: { x: number; y: number }, nodes: readonly NodeGraphEditorNode[]) {
    return nodes.some((node) => {
      const nodeRect = { x: node.global.x, y: node.global.y, width: node.nodeSize.width, height: node.nodeSize.height };
      return (
        pos.x >= nodeRect.x &&
        pos.x <= nodeRect.x + nodeRect.width &&
        pos.y >= nodeRect.y &&
        pos.y <= nodeRect.y + nodeRect.height
      );
    });
  }

  multiselectNodes(x, y, x2, y2, mode) {
    const selectRect = { x: Math.min(x, x2), y: Math.min(y, y2), width: Math.abs(x2 - x), height: Math.abs(y2 - y) };

    //select all comments
    this.commentLayer.performMultiSelect(selectRect, mode);

    // Select all nodes with a vertex inside of the multiselect area
    const selected = [];
    this.forEachNode((node) => {
      const nodeRect = { x: node.global.x, y: node.global.y, width: node.nodeSize.width, height: node.nodeSize.height };
      if (rectanglesOverlap(nodeRect, selectRect)) {
        selected.push(node);
      }
    });

    if (mode === 'select') {
      this.selector.select(selected);
    } else if (mode === 'union') {
      this.selector.select(this.lastMultiselected ? _.union(this.lastMultiselected, selected) : selected);
    } else if (mode === 'reduce') {
      this.selector.select(this.lastMultiselected ? _.difference(this.lastMultiselected, selected) : []);
    }
  }

  isHighlighted(node) {
    return this.highlighted === node || this.selector.isActive(node);
  }

  openConnectionPanels() {
    // Hide viewer
    ipcRenderer.send('viewer-hide');

    // If a single or multiselect node is selected, deselect them
    this.deselect();

    const _this = this;
    setTimeout(() => {
      const topLeft = function (obj) {
        let curleft = (_this.curtop = 0);
        if (obj.offsetParent) {
          do {
            curleft += obj.offsetLeft;
            _this.curtop += obj.offsetTop;
          } while ((obj = obj.offsetParent));
        }
        return [curleft, _this.curtop];
      };

      const canvas = this.$('#nodegraphcanvas')[0];
      const tl = topLeft(canvas);

      const panAndScale = this.getPanAndScale();

      const fromNode = this.draggingConnection.fromNode;
      const toNode = this.draggingConnection.toNode;

      const fromNodeXPos = fromNode.global.x - 10;

      fromNode.borderHighlighted = true;
      toNode.borderHighlighted = false;

      let activePanel = 'from';

      function isPanelActive(id: string) {
        return activePanel === id;
      }

      // Show source node port picker
      const fromProps = {
        model: fromNode.model,
        type: 'from',
        disabled: false,
        isPanelActive,
        onPortSelected: (fromPort) => {
          activePanel = 'to';
          // @ts-expect-error
          toProps.sourcePort = fromPort;
          toProps.disabled = false;
          ReactDOM.render(React.createElement(ConnectionPopup, toProps), toDiv);

          fromProps.disabled = true;
          ReactDOM.render(React.createElement(ConnectionPopup, fromProps), fromDiv);

          fromNode.borderHighlighted = false;
          toNode.borderHighlighted = true;
          this.repaint();
        }
      };
      const fromDiv = document.createElement('div');
      ReactDOM.render(React.createElement(ConnectionPopup, fromProps), fromDiv);

      const fromPosition = toNode.global.x > fromNodeXPos ? 'left' : 'right';

      ipcRenderer.send('viewer-hide');

      const fromPopout = PopupLayer.instance.showPopout({
        content: { el: $(fromDiv) },
        position: fromPosition,
        arrowColor: '#464648',
        attachToPoint: {
          x:
            (fromNode.global.x + panAndScale.x) * panAndScale.scale +
            tl[0] +
            fromNode.nodeSize.width * (fromPosition === 'left' ? 0 : 1.0) * panAndScale.scale,
          y: (fromNode.global.y + panAndScale.y) * panAndScale.scale + tl[1] + 20 * panAndScale.scale
        },
        onClose: () => {
          ReactDOM.unmountComponentAtNode(fromDiv);
          ipcRenderer.send('viewer-show');
        }
      });

      // Show target node port picker
      const toProps = {
        model: toNode.model,
        fromNode: fromNode.model,
        type: 'to',
        disabled: true,
        isPanelActive,
        onPortSelected: (toPort) => {
          activePanel = 'from';
          // Make the connection
          // Create the connection, this must be undoable
          // @ts-expect-error
          if (toProps.sourcePort !== undefined) {
            const c = {
              fromId: fromNode.model.id,
              // @ts-expect-error
              fromProperty: toProps.sourcePort,
              toId: toNode.model.id,
              toProperty: toPort
            };

            this.model.addConnection(c, {
              undo: true,
              label: 'connect'
            });

            // @ts-expect-error
            toProps.sourcePort = undefined;
            toProps.disabled = true;
            ReactDOM.render(React.createElement(ConnectionPopup, toProps), toDiv);

            fromProps.disabled = false;
            ReactDOM.render(React.createElement(ConnectionPopup, fromProps), fromDiv);

            fromNode.borderHighlighted = true;
            toNode.borderHighlighted = false;
            this.repaint();
          }
        }
      };
      const toDiv = document.createElement('div');
      ReactDOM.render(React.createElement(ConnectionPopup, toProps), toDiv);

      const toPosition = fromNodeXPos >= toNode.global.x ? 'left' : 'right';
      const toPopout = PopupLayer.instance.showPopout({
        content: { el: $(toDiv) },
        position: toPosition,
        arrowColor: '#464648',
        attachToPoint: {
          x:
            (toNode.global.x + panAndScale.x) * panAndScale.scale +
            tl[0] +
            toNode.nodeSize.width * (toPosition === 'left' ? 0 : 1.0) * panAndScale.scale,
          y: (toNode.global.y + panAndScale.y) * panAndScale.scale + tl[1] + 20 * panAndScale.scale
        },
        onClose: () => {
          ReactDOM.unmountComponentAtNode(toDiv);
          this.clearSelection();
          this.repaint();
        }
      });
    }, 0);
  }

  closeConnectionPanels() {
    ipcRenderer.send('viewer-show');
  }

  detachNode(node) {
    this.model.detachNode(node, { undo: this.dragNodesUndoGroup });
  }

  attachNode(parent, node, index) {
    this.model.attachNode(parent, node, index, {
      undo: this.dragNodesUndoGroup
    });
  }

  nudgeNode(node: NodeGraphEditorNode, x: number, y: number) {
    const enabled = EditorSettings.instance.get('nodeGraphEditor.snapToGrid');
    if (!enabled) return;

    //nodes with parent's don't use their x and y coords, so just bail out
    if (node.parent || (node.x === x && node.y === y)) return;

    const startX = node.x;
    const startY = node.y;

    const startTime = performance.now();
    const anim = () => {
      const linearT = Math.min(1, (performance.now() - startTime) / 200);
      const easeOutT = 1 - Math.pow(1 - linearT, 4);

      node.x = startX * (1 - easeOutT) + x * easeOutT;
      node.y = startY * (1 - easeOutT) + y * easeOutT;

      this.relayout();
      this.repaint();

      if (easeOutT < 1) requestAnimationFrame(anim);
    };

    requestAnimationFrame(anim);
  }

  snapNodeToGrid(node: NodeGraphEditorNode) {
    const enabled = EditorSettings.instance.get('nodeGraphEditor.snapToGrid');
    if (!enabled) return;

    this.nudgeNode(
      node,
      Math.round(node.x / SnapSpacing) * SnapSpacing,
      Math.round(node.y / SnapSpacing) * SnapSpacing
    );
  }

  commitMoveNode(node) {
    const from = { x: node.model.x, y: node.model.y };
    const to = { x: node.x, y: node.y };

    const move = (to) => {
      node.model.set(to);

      node.x = to.x;
      node.y = to.y;

      this.snapNodeToGrid(node);

      this.relayout();
      this.repaint();
    };

    // Make sure we can undo move nodes
    if (from.x !== to.x || from.y !== to.y) {
      move(to);
      this.dragNodesUndoGroup.push({
        do: function () {
          move(to);
        },
        undo: function () {
          move(from);
        }
      });
    }
  }

  removeConnection(con) {
    this.model.removeConnection(con, { undo: true, label: 'disconnect' });
  }

  doDragNodesAndComments(draggingNodes, type, pos, evt) {
    if (type === 'move') {
      // Move all dragging nodes that are root nodes
      const dx = pos.x - this.lastDraggingMousePos.x;
      const dy = pos.y - this.lastDraggingMousePos.y;

      for (const n of draggingNodes) {
        if (!n.parent) {
          n.x += dx;
          n.y += dy;
        }
      }

      this.commentLayer.moveSelectedComments(dx, dy);

      this.lastDraggingMousePos = pos;

      // If we have dragged more than a given threshold, disconnect all nodes that are
      // currently in the hierarchy.
      if (
        Math.abs(pos.x - this.startDraggingMousePos.x) > NodeGraphEditorNode.attachedThreshold ||
        Math.abs(pos.y - this.startDraggingMousePos.y) > NodeGraphEditorNode.attachedThreshold
      ) {
        for (const n of draggingNodes) {
          if (n.parent) this.detachNode(n.model);
        }
      }

      // If the nodes are detached
      const detached = draggingNodes.length && !_.some(draggingNodes, (n) => n.parent);
      if (detached) {
        for (const i in this.roots) {
          // Don't attached to any nodes that are part of the current dragging
          // nodes
          if (draggingNodes.indexOf(this.roots[i]) !== -1) continue;

          this.insertLocation = this.roots[i].shouldAttach(pos, draggingNodes);
          if (this.insertLocation) break;
        }
      }

      evt.consumed = true;
      this.relayout();
      this.repaint();
    } else if (type === 'up') {
      const isClick =
        Math.abs(pos.x - this.startDraggingMousePos.x) < 5 && Math.abs(pos.y - this.startDraggingMousePos.y) < 5;

      // No insert location simply move the nodes
      // Update the model for all dragging nodes
      if (!isClick && (this.commentLayer.getSelectedComments().length || draggingNodes.length)) {
        //nodes or comments are selected, and we've moved the mouse since the down event
        //this means we've dragged elements around, so consume the event
        for (const n of draggingNodes) {
          this.commitMoveNode(n);
        }

        this.commentLayer.commitSelectedComments({ undo: this.dragNodesUndoGroup });

        evt.consumed = true;
      }

      if (this.insertLocation) {
        // We have a new location for the insert it and relayout
        // Notify the model that a node should be attached
        const loc = this.insertLocation;
        for (let index = draggingNodes.length - 1; index >= 0; index--) {
          const n = draggingNodes[index];
          this.attachNode(loc.parent.model, n.model, loc.index);
        }
        this.insertLocation = undefined;
        evt.consumed = true;
      }

      // Commit undo action group
      if (this.dragNodesUndoGroup && !this.dragNodesUndoGroup.isEmpty()) {
        this.dragNodesUndoGroup.pushAndDo({
          do: () => {
            setTimeout(() => {
              this.layout();
              this.updateNodeToolbar();
            }, 1);
          },
          undo: () => {
            setTimeout(() => {
              this.layout();
              this.updateNodeToolbar();
            }, 1);
          }
        });

        UndoQueue.instance.push(this.dragNodesUndoGroup);
      }
      this.dragNodesUndoGroup = undefined;

      this.draggingNodes = undefined;
    }
  }

  doDragging(type: MouseEventType, pos: IVector2, evt: TSFixme) {
    // Node is being dragged to a new position
    if (this.draggingNodes) {
      this.doDragNodesAndComments(this.draggingNodes, type, pos, evt);
      if (evt.consumed) return true;
    }

    // A new connections is being dragged
    if (this.draggingConnection && !this.draggingConnection.popupOpen) {
      if (type === 'move') {
        // Hide viewer to get it out of the way
        ipcRenderer.send('viewer-hide');

        this.draggingConnection.pos = pos;

        this.draggingConnection.mouseTarget.global = pos;
        if (this.draggingConnection.toNode) this.draggingConnection.toNode.borderHighlighted = false;

        let toNode;
        for (const i in this.roots) {
          toNode = this.roots[i].shouldConnect(pos, this.draggingConnection.fromNode);
          if (toNode) break;
        }

        if (toNode && toNode != this.draggingConnection.fromNode) {
          toNode.borderHighlighted = true;
          this.draggingConnection.toNode = toNode;
        } else {
          this.draggingConnection.toNode = undefined;
        }

        this.repaint();
      } else if (type === 'up') {
        // Show the viewer again
        ipcRenderer.send('viewer-show');

        if (this.draggingConnection.toNode) {
          // We have a potential new connection
          this.draggingConnection.popupOpen = true;

          this.openConnectionPanels();
          evt.stopPropagation();
        } else {
          // No new connection, clear it
          this.draggingConnection.fromNode.borderHighlighted = false;
          this.draggingConnection = undefined;
        }

        this.repaint();
      }
      return true;
    }

    // Multi select in action
    if (this.multiselectMouseDown) {
      if (type === 'move') {
        let mode = 'select';
        if (evt.shiftKey) mode = 'union';
        else if (evt.ctrlKey) mode = 'reduce';

        this.multiselectMouseMove = pos;
        this.multiselectNodes(
          this.multiselectMouseDown.x,
          this.multiselectMouseDown.y,
          this.multiselectMouseMove.x,
          this.multiselectMouseMove.y,
          mode
        );
        this.repaint();
      } else if (type === 'up') {
        const isClick =
          Math.abs(pos.x - this.multiselectMouseDown.x) < 5 && Math.abs(pos.y - this.multiselectMouseDown.y) < 5;

        if (isClick) {
          this.commentLayer.clearSelection();
        }

        this.multiselectMouseDown = this.multiselectMouseMove = undefined;
        if (!this.selector.active) this.selector.unselect();

        this.repaint();
      }
      return true;
    }
  }

  updateNodeToolbar() {
    this.hideNodeToolbar(); //hide existing toolbar, if any

    const selection = this.selector.nodes;

    if (selection.length > 0 && !selection[0].selected) {
      const aabb = this.calculateNodesAABB(selection);
      this.showNodeToolbar(selection, aabb);
    }
  }

  showNodeToolbar(selectedNodes: readonly NodeGraphEditorNode[], aabb: AABB) {
    const menuItems: PopupToolbarProps['menuItems'] = [];

    const canExtract = canExtractToComponent(this.model, selectedNodes);
    if (canExtract.allow) {
      menuItems.push({
        tooltip: 'Extract to component',
        icon: IconName.Component,
        onClick: () => {
          this.hideNodeToolbar();
          this.extractSelectionToComponent();
        }
      });
    }

    if (
      selectedNodes.length === 1 &&
      CreateNewNodePanel.shouldShow({
        component: this.model.owner,
        parentModel: selectedNodes[0].model
      })
    ) {
      menuItems.push({
        tooltip: 'Add new child',
        onClick: () => {
          this.hideNodeToolbar();

          this.createNewNodePanel = new CreateNewNodePanel({
            model: this.model,
            parentModel: this.highlighted ? this.highlighted.model : undefined,
            pos: { x: 0, y: 0 },
            runtimeType: this.runtimeType
          });
          this.createNewNodePanel.render();

          setTimeout(() => {
            PopupLayer.instance.showPopup({
              content: this.createNewNodePanel,
              position: 'screen-center',
              isBackgroundDimmed: true,
              onClose: () => this.createNewNodePanel.dispose()
            });
          }, 1);
        },
        icon: IconName.Plus
      });
    }

    const div = document.createElement('div');
    div.className = 'nodegraph-node-toolbar';
    this.domElementContainer.appendChild(div);

    const pos = {
      x: (aabb.minX + aabb.maxX) / 2,
      y: aabb.minY
    };

    div.style.width = 'max-content';
    div.style.transform = 'translate(-50%, calc(-100% - 10px))';
    div.style.position = 'absolute';
    div.style.left = pos.x + 'px';
    div.style.top = pos.y + 'px';

    ReactDOM.render(
      React.createElement(PopupToolbar, {
        menuItems,
        contextMenuItems: this.getContextMenuActions()
      } as PopupToolbarProps),
      div
    );
  }

  hideNodeToolbar() {
    const toolbars = this.domElementContainer.querySelectorAll('.nodegraph-node-toolbar');
    for (const toolbar of toolbars) {
      ReactDOM.unmountComponentAtNode(toolbar);
      this.domElementContainer.removeChild(toolbar);
    }
  }

  setMouseEventsEnabled(enabled) {
    this.mouseEventsEnabled = enabled;
  }

  relativeCoordsToNodeGraphCords(pos: { x: number; y: number }): { x: number; y: number } {
    const panAndScale = this.getPanAndScale();
    return {
      x: pos.x / panAndScale.scale - panAndScale.x,
      y: pos.y / panAndScale.scale - panAndScale.y
    };
  }

  mouse(type: MouseEventType, pos: MousePosition, evt: NodeGraphMouseEvent, args?: TSFixme) {
    if (!this.mouseEventsEnabled || !this.model) {
      return false;
    }

    const _this = this;
    const panAndScale = this.getPanAndScale();
    const scale = panAndScale.scale;
    const scaledPos = this.relativeCoordsToNodeGraphCords(pos);

    if (type === 'down' && evt.button === 0) {
      //hide inspectors that aren't pinned
      this.hideInspectors();
      this.hideNodeToolbar();
    }

    //Elements in the dom layer (e.g. inspectors) are hidden when a node or connection is being dragged
    //Show them again if a mouse up event is triggered
    else if (type === 'up') {
      this.setDOMLayerVisible(true);
      this.updateNodeToolbar();
    }

    // Check for double clicks
    if (evt.button === 0 && evt.type === 'mousedown') {
      const lastPressed = this.lastLeftButtonPressedTime;
      const now = Date.now();

      if (now - lastPressed < 500) {
        // click interval here!
        this.leftButtonIsDoubleClicked = true;
      } else {
        this.leftButtonIsDoubleClicked = false;
      }

      this.lastLeftButtonPressedTime = now;
    }

    this.latestMousePos = scaledPos;

    if (!this.doDragging(type, scaledPos, evt)) {
      // If we are in "connection mode" then don't do any mouse tracking
      // until it is canceled
      const isPanning = this.panMouseDown || (evt.spaceKey && evt.button === 0);

      if (!isPanning && !(this.draggingConnection && this.draggingConnection.popupOpen)) {
        for (const i in this.roots) {
          this.roots[i].propagateMouse(type, scaledPos, evt);
        }
      }

      // Pass mouse to connections
      if (!evt.consumed) {
        for (const i in this.connections) {
          this.connections[i].mouse(type, scaledPos, evt);
        }
      }

      // If a drag item is current in place indicate if
      // a drop can be accepted
      if (PopupLayer.instance.isDragging()) {
        const dragItem = PopupLayer.instance.dragItem;

        // Indicate drop acceptable
        if (type === 'move') {
          if (canAcceptDrop(_this, dragItem)) {
            PopupLayer.instance.indicateDropType('add');
          } else {
            PopupLayer.instance.indicateDropType('none');
          }
        } else if (type === 'out') {
          PopupLayer.instance.indicateDropType('none');
          PopupLayer.instance.setDragMessage();
        }
        // Make the drop
        else if (type === 'up') {
          // Create the new component that was dropped
          if (canAcceptDrop(_this, dragItem)) {
            evt.consumed = onDrop(this, dragItem, scaledPos);
          }
        }
      }

      if (evt.consumed) {
        return true;
      }

      // Clear selection on left mouse up when no node is
      // highlighted
      if (
        !this.readOnly &&
        type === 'up' &&
        evt.button === 0 &&
        !evt.shiftKey &&
        this.highlighted === undefined &&
        this.highlightedConnection === undefined
      ) {
        this.clearSelection();
        this.repaint();
      }

      // Pan view on right mouse drag, middle mouse drag, or space + left mouse
      if (type === 'down' && (evt.button === 2 || evt.button === 1 || (evt.spaceKey && evt.button === 0))) {
        this.panMouseDown = pos;
        this.canvas.ctx.canvas.style.cursor = 'grabbing';
        evt.consumed = true;
      } else if (type === 'move' && this.panMouseDown) {
        // Move all roots and relayout
        this.moveRoots((pos.x - this.panMouseDown.x) / scale, (pos.y - this.panMouseDown.y) / scale);
        this.panMouseDown = pos;
        this.relayout();
        this.repaint();
        evt.consumed = true;
      } else if ((type === 'up' || type === 'out') && this.panMouseDown) {
        this.panMouseDown = this.originMouseDown = undefined;
        this.canvas.ctx.canvas.style.cursor = 'inherit';
      }

      // Handle right click
      if (type === 'down' && evt.button === 2) {
        this.rightClickPos = pos;
      } else if (type === 'up' && evt.button === 2 && this.rightClickPos) {
        if (
          this.model &&
          !this.readOnly &&
          Math.abs(pos.x - this.rightClickPos.x) + Math.abs(pos.y - this.rightClickPos.y) < 10
        ) {
          PopupLayer.instance.hidePopup();
          evt.consumed = true;

          if (this.isPointInsideNodes(scaledPos, this.selector.nodes)) {
            this.openRightClickMenu();
          } else if (
            CreateNewNodePanel.shouldShow({
              component: this.model.owner,
              parentModel: this.highlighted ? this.highlighted.model : undefined
            })
          ) {
            this.createNewNodePanel = new CreateNewNodePanel({
              model: this.model,
              parentModel: this.highlighted ? this.highlighted.model : undefined,
              pos: scaledPos,
              runtimeType: this.runtimeType
            });
            this.createNewNodePanel.render();

            PopupLayer.instance.showPopup({
              content: this.createNewNodePanel,
              /*attachToPoint:{x:pos.pageX, y:pos.pageY},*/
              position: 'screen-center',
              isBackgroundDimmed: true,
              onClose: () => this.createNewNodePanel.dispose()
            });
          } else {
            PopupLayer.instance.showTooltip({
              x: evt.pageX,
              y: evt.pageY,
              position: 'bottom',
              content: 'This node type cannot have children.'
            });
          }
        }
        this.rightClickPos = undefined;
      }

      // Start multi select, move is handled in the do dragging function
      if (
        !this.readOnly &&
        !evt.consumed &&
        type === 'down' &&
        evt.button === 0 &&
        !evt.spaceKey &&
        this.highlighted === undefined &&
        this.highlightedConnection === undefined &&
        this.draggingConnection === undefined &&
        !(args && args.eventPropagatedFromCommentLayer)
      ) {
        // Store last multi select reduce and union operations
        this.lastMultiselected = this.selector.nodes;

        // reset current multi selection if it's not the start of a new multi select operation (ctrl or shift is pressed)
        if (!evt.ctrlKey && !evt.shiftKey) {
          this.commentLayer.clearMultiselection();
          this.clearSelection();
        } else {
          this.selector.select(this.lastMultiselected);
        }

        this.multiselectMouseDown = scaledPos;

        this.repaint();
      }
    }

    const needRepaint =
      type != 'over' && type !== 'out' && !(type === 'move' && !this.rightClickPos && evt.button !== 0);

    if (needRepaint) {
      this.relayout();
      this.repaint();
    }

    return evt.consumed;
  }

  getContextMenuActions() {
    const items = [];

    const selectedNodes = this.selector.nodes;

    const canExtract = canExtractToComponent(this.model, selectedNodes);
    items.push({
      label: 'Extract to component',
      icon: IconName.Component,
      onClick: () => this.extractSelectionToComponent(),
      isDisabled: !canExtract.allow,
      tooltip: canExtract.reason,
      tooltipShowAfterMs: 300
    });

    items.push('divider');

    if (
      selectedNodes.length === 1 &&
      CreateNewNodePanel.shouldShow({
        component: this.model.owner,
        parentModel: selectedNodes[0].model
      })
    ) {
      items.push({
        label: 'Add new child',
        onClick: () => {
          const selectedNode = this.selector.nodes[0];
          this.createNewNodePanel = new CreateNewNodePanel({
            model: this.model,
            parentModel: selectedNode?.model,
            pos: { x: 0, y: 0 },
            runtimeType: this.runtimeType
          });
          this.createNewNodePanel.render();

          PopupLayer.instance.showPopup({
            content: this.createNewNodePanel,
            position: 'screen-center',
            isBackgroundDimmed: true,
            onClose: () => this.createNewNodePanel.dispose()
          });
        },
        icon: IconName.Plus
      });
    }

    items.push({
      label: 'Delete',
      onClick: () => this.delete(),
      icon: IconName.Trash
    });

    return items;
  }

  openRightClickMenu() {
    showContextMenuInPopup({
      items: this.getContextMenuActions(),
      width: MenuDialogWidth.Default,
      renderDirection: DialogRenderDirection.Horizontal
    });
  }

  layoutAndPaint() {
    if (!this.el) {
      return;
    }

    if (this._disposed) return;

    if (this.relayoutNeeded) this.layout();

    this.paint();

    this.relayoutNeeded = this.layoutAndPaintScheduled = false;
  }

  relayout() {
    this.relayoutNeeded = true;
  }

  layout() {
    if (!this.model) {
      return;
    }

    this.forEachNode(function (node) {
      node.measuredSize = undefined;
    });

    _.each(this.roots, function (node) {
      node.measure();
      node.setPosition(node.x, node.y);
      node.layout();
    });

    this.calculateAABB();
  }

  repaint() {
    if (!this.layoutAndPaintScheduled) {
      window.requestAnimationFrame(this.layoutAndPaint.bind(this));
      this.layoutAndPaintScheduled = true;
    }
  }

  calculateAABB() {
    const _this = this;
    this.graphAABB = {
      minX: Number.MAX_VALUE,
      maxX: -Number.MAX_VALUE,
      minY: Number.MAX_VALUE,
      maxY: -Number.MAX_VALUE
    };

    _.each(this.roots, function (node) {
      if (node.x < _this.graphAABB.minX) {
        _this.graphAABB.minX = node.x;
      }
      if (node.x + node.measuredSize.width > _this.graphAABB.maxX) {
        _this.graphAABB.maxX = node.x + node.measuredSize.width;
      }
      if (node.y < _this.graphAABB.minY) {
        _this.graphAABB.minY = node.y;
      }
      if (node.y + node.measuredSize.height > _this.graphAABB.maxY) {
        _this.graphAABB.maxY = node.y + node.measuredSize.height;
      }
    });

    _.each(this.model.commentsModel.comments, function (comment) {
      if (comment.x < _this.graphAABB.minX) {
        _this.graphAABB.minX = comment.x;
      }
      if (comment.x + comment.width > _this.graphAABB.maxX) {
        _this.graphAABB.maxX = comment.x + comment.width;
      }
      if (comment.y < _this.graphAABB.minY) {
        _this.graphAABB.minY = comment.y;
      }
      if (comment.y + comment.height > _this.graphAABB.maxY) {
        _this.graphAABB.maxY = comment.y + comment.height;
      }
    });
  }
  findNodeWithId(id: string): NodeGraphEditorNode {
    let res;
    this.forEachNode(function (node) {
      if (id === node.id) {
        res = node;
        return true;
      }
    });
    return res;
  }

  findConnectionWithModel(model: Connection): NodeGraphEditorConnection {
    for (const i in this.connections) if (this.connections[i].model === model) return this.connections[i];
  }

  findConnectionWithKey(key: string): NodeGraphEditorConnection {
    for (const i in this.connections) {
      const m = this.connections[i].model;
      if (m.fromId + m.fromProperty + m.toId + m.toProperty === key) return this.connections[i];
    }
  }

  findInspectorWithModel(model) {
    return this.inspectors.find((inspector) => inspector.model === model);
  }

  paint() {
    if (!this.canvas.width || !this.canvas.height) {
      return;
    }

    const ctx = this.canvas.ctx;
    const panAndScale = this.getPanAndScale();
    const scale = this.getPanAndScale().scale;

    const transform = `scale(${panAndScale.scale}) translate(${panAndScale.x}px, ${panAndScale.y}px)`;
    this.domElementContainer.style.transform = transform;

    this.commentLayer && this.commentLayer.setPanAndScale(panAndScale);

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!NodeLibrary.instance.isLoaded()) {
      // Don't paint if we don't have a node library yet
      return;
    }

    ctx.save();
    ctx.scale(this.canvas.ratio * scale, this.canvas.ratio * scale);
    ctx.translate(panAndScale.x, panAndScale.y);

    const paintRect = {
      minX: -panAndScale.x,
      maxX: this.canvas.width / (this.canvas.ratio * scale) - panAndScale.x,
      minY: -panAndScale.y,
      maxY: this.canvas.height / (this.canvas.ratio * scale) - panAndScale.y
    };

    ctx.font = '10px Helvetica';

    // Paint hierarchy
    function paintHierarchy(node) {
      const x = node.global.x;
      const y = node.global.y;

      // Draw hierarchy indicators
      let hy = y + node.nodeSize.height + 5;
      ctx.strokeStyle = '#504f4f'; //Grey 700
      ctx.lineWidth = 1;
      for (const i in node.children) {
        const child = node.children[i];

        ctx.beginPath();
        ctx.moveTo(x + NodeGraphEditorNode.childMargin / 2, hy);

        hy = child.global.y + child.nodeSize.height / 2;
        ctx.lineTo(x + NodeGraphEditorNode.childMargin / 2, hy);

        ctx.lineTo(x + NodeGraphEditorNode.childMargin - 5, hy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      _.each(node.children, paintHierarchy);
    }

    // Paint hierarchy
    _.each(this.roots, paintHierarchy);

    // Paint connections
    _.each(this.connections, function (con) {
      con.paint(ctx, paintRect);
    });

    // Paint all highlighted connections (so they always show up on top)
    _.each(this.connections, function (con) {
      if (con.isHighlighted()) con.paint(ctx, paintRect);
    });

    // Paint nodes
    const _this = this;
    _.each(this.roots, function (node) {
      if (!_this.draggingNodes || _this.draggingNodes.indexOf(node) === -1) {
        node.paint(ctx, paintRect);
      }
    });

    if (this.insertLocation) {
      // Indicate that we have an insert location when
      // dragging this node
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        this.insertLocation.pos.x,
        this.insertLocation.pos.y + (NodeGraphEditorNode.childSpacing - 5) / 2,
        NodeGraphEditorNode.size.width,
        5
      );
    }

    // Paint multiselect box
    if (this.selector.nodes.length > 0 && !this.selector.nodes[0].selected) {
      this.paintMultiselectBox(ctx, this.calculateNodesAABB(this.selector.nodes));
    }

    // if (window._debugNodeGraphAttachPoints) {
    //   ctx.save();
    //   for (const attach of window._debugNodeGraphAttachPoints) {
    //     ctx.fillStyle = '#ff00ff';
    //     ctx.fillRect(attach.anchorPoint.x - 6, attach.anchorPoint.y - 6, 12, 12);
    //   }
    //   ctx.restore();
    // }
    ctx.globalAlpha = 0.5;

    // Paint nodes that are being dragged
    _.each(this.draggingNodes, function (node) {
      node.paint(ctx, paintRect);
    });

    ctx.globalAlpha = 1;

    // Paint the new connection indicator if we have one
    if (this.draggingConnection) {
      // Make background darker
      if (this.draggingConnection.fromNode !== undefined && this.draggingConnection.toNode !== undefined) {
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(paintRect.minX, paintRect.minY, paintRect.maxX - paintRect.minX, paintRect.maxY - paintRect.minY);
        ctx.globalAlpha = 1;

        // First the two nodes where a connection is being made
        _.each([this.draggingConnection.fromNode, this.draggingConnection.toNode], function (node) {
          node.paint(ctx, paintRect, { dontPaintChildren: true });
        });

        // Draw all connections between these nodes
        _.each(this.connections, (con) => {
          if (con.fromNode === this.draggingConnection.fromNode && con.toNode === this.draggingConnection.toNode)
            con.paint(ctx, paintRect);
        });
      }

      ctx.globalAlpha = 1;

      // Draw line between from node and mouse position, if a target node is hovered
      // draw to the center of the target node
      ctx.strokeStyle = NodeGraphColors.yellow;
      ctx.setLineDash([5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      const from = {
        x: this.draggingConnection.fromNode.global.x + this.draggingConnection.fromNode.nodeSize.width,
        y: this.draggingConnection.fromNode.global.y + this.draggingConnection.fromNode.titlebarHeight() / 2
      };
      if (this.draggingConnection.toNode) {
        var to = {
          x: this.draggingConnection.toNode.global.x + this.draggingConnection.toNode.nodeSize.width / 2,
          y: this.draggingConnection.toNode.global.y + this.draggingConnection.toNode.nodeSize.height / 2
        };
      } else {
        to = this.draggingConnection.mouseTarget.global;
      }

      const d = { x: to.x - from.x, y: to.y - from.y };
      const dl = Math.sqrt(d.x * d.x + d.y * d.y);
      d.x /= dl;
      d.y /= dl;
      const n = { x: d.y, y: -d.x };

      ctx.moveTo(from.x + d.x * 4, from.y + d.y * 4); // Don't draw over source circle, looks weird when alpha is down
      ctx.lineTo(to.x - d.x * 6, to.y - d.y * 6);
      ctx.stroke();

      // Draw the circle at the source node and the arrow head
      // at the target node
      ctx.beginPath();
      ctx.fillStyle = NodeGraphColors.yellow;
      ctx.arc(from.x, from.y, 4, 0, 2 * Math.PI, false);

      ctx.moveTo(to.x + d.x * 2, to.y + d.y * 2);
      ctx.lineTo(to.x - d.x * 6 - n.x * 4, to.y - d.y * 6 - n.y * 4);
      ctx.lineTo(to.x - d.x * 6 + n.x * 4, to.y - d.y * 6 + n.y * 4);
      ctx.fill();

      ctx.globalAlpha = 1;
    }

    // Paint multiselect
    if (this.multiselectMouseMove) {
      ctx.strokeStyle = NodeGraphColors.multiSelect;
      ctx.setLineDash([5]);
      ctx.beginPath();
      ctx.rect(
        this.multiselectMouseDown.x,
        this.multiselectMouseDown.y,
        this.multiselectMouseMove.x - this.multiselectMouseDown.x,
        this.multiselectMouseMove.y - this.multiselectMouseDown.y
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  paintMultiselectBox(ctx: CanvasRenderingContext2D, aabb: AABB) {
    const pad = 8;

    const shadowSize = 150;

    //draw a shadow
    //mask away everything inside the selection bounding box...
    const w = aabb.maxX - aabb.minX;
    const h = aabb.maxY - aabb.minY;
    ctx.save();
    ctx.beginPath();
    ctx.rect(aabb.minX - shadowSize, aabb.minY - shadowSize, 2 * shadowSize + w, shadowSize - pad);
    ctx.rect(aabb.minX - shadowSize, aabb.minY - pad, shadowSize - pad, h + 2 * pad + 2 * shadowSize);
    ctx.rect(aabb.maxX + pad, aabb.minY - pad, shadowSize, h + 2 * pad);
    ctx.rect(aabb.minX - shadowSize, aabb.maxY + pad, 2 * shadowSize + w, shadowSize);
    ctx.clip();

    //...and draw a shadow
    ctx.shadowColor = 'black';
    ctx.shadowBlur = shadowSize;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = 'white'; //the color doesn't matter, just need full opacity. The rect is clipped and just the shadow remains
    ctx.beginPath();
    ctx.fillRect(aabb.minX - pad, aabb.minY - pad, w + 2 * pad, h + 2 * pad);

    //draw selection box
    ctx.lineWidth = 1;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--theme-color-fg-default').trim();
    ctx.strokeRect(aabb.minX - pad, aabb.minY - pad, w + 2 * pad, h + 2 * pad);

    ctx.restore();
  }

  // This function is used during the tests to verify that the view of the node graph editor
  // matches the model
  verifyWithModel() {
    const _this = this;

    let verified = true;
    function assert(cond) {
      if (!cond) verified = false;
    }

    this.forEachNode(function (node) {
      const model = node.model;

      assert(_this.findNodeWithId(model.id) == node);

      // Make sure parent are correctly linked
      if (node.parent) assert(_this.findNodeWithId(model.parent.id) === node.parent);
      else assert(!model.parent);
    });

    return verified;
  }

  /**
   * @returns The center of all the root nodes in the graph.
   */
  public getCenterRootPanAndScale(): PanAndScale {
    let centerX = 0;
    let centerY = 0;
    let count = 0;

    _.each(this.roots, function (root) {
      centerX += root.x + root.nodeSize.width / 2;
      centerY += root.y + root.nodeSize.height / 2;
      count++;
    });

    const centerViewX = this.canvas.width / this.canvas.ratio / 2;
    const centerViewY = this.canvas.height / this.canvas.ratio / 2;

    return {
      x: centerViewX - centerX / count,
      y: centerViewY - centerY / count,
      scale: 1
    };
  }

  /**
   * @returns The center of all the nodes in the graph.
   */
  public getCenterPanAndScale(): PanAndScale {
    let centerX = 0;
    let centerY = 0;
    let count = 0;

    _.each(this.roots, function (root) {
      centerX += root.x + root.measuredSize.width / 2;
      centerY += root.y + root.measuredSize.height / 2;
      count++;
    });

    const centerViewX = this.canvas.width / this.canvas.ratio / 2;
    const centerViewY = this.canvas.height / this.canvas.ratio / 2;

    return {
      x: centerViewX - centerX / count,
      y: centerViewY - centerY / count,
      // TODO: Do we want to figure out the scale here too?
      scale: 1
    };
  }

  /**
   * Center the camera in the middle of all the nodes.
   *
   * @returns The current pan and scale.
   */
  public centerToFit(mode: CenterToFitMode) {
    switch (mode) {
      default:
      case CenterToFitMode.RootNodes: {
        this.setPanAndScale(this.getCenterRootPanAndScale());
        break;
      }

      case CenterToFitMode.AllNodes: {
        this.setPanAndScale(this.getCenterPanAndScale());
        break;
      }
    }

    return this.panAndScale;
  }

  getPanAndScale() {
    if (this.panAndScale) {
      return this.panAndScale;
    }

    if (!this.model || !this.canvas.width || !this.canvas.height || !this.roots.length) {
      return { scale: 1, x: 0, y: 0 };
    }

    return this.centerToFit(CenterToFitMode.RootNodes);
  }

  setPanAndScale(panAndScale: PanAndScale) {
    this.panAndScale = panAndScale;
    this.commentLayer && this.commentLayer.setPanAndScale(panAndScale);
  }

  clampPanAndScale(panAndScale: PanAndScale) {
    if (!this.model || this.model.roots.length === 0) return panAndScale;

    const ClampPadding = 100;

    const graphAABB = this.graphAABB;

    const canvasWidth = this.canvas.width / (this.canvas.ratio * panAndScale.scale);
    const canvasHeight = this.canvas.height / (this.canvas.ratio * panAndScale.scale);

    const visiblePixelsAtLeftBorder = panAndScale.x + graphAABB.maxX;
    const visiblePixelsAtTopBorder = panAndScale.y + graphAABB.maxY;
    const visiblePixelsAtRightBorder = canvasWidth - panAndScale.x - graphAABB.minX;
    const visiblePixelsAtBottomBorder = canvasHeight - panAndScale.y - graphAABB.minY;

    if (visiblePixelsAtLeftBorder < ClampPadding) {
      panAndScale.x = ClampPadding - graphAABB.maxX;
    }
    if (visiblePixelsAtRightBorder < ClampPadding) {
      panAndScale.x = canvasWidth - graphAABB.minX - ClampPadding;
    }

    if (visiblePixelsAtTopBorder < ClampPadding) {
      panAndScale.y = ClampPadding - graphAABB.maxY;
    }
    if (visiblePixelsAtBottomBorder < ClampPadding) {
      panAndScale.y = canvasHeight - graphAABB.minY - ClampPadding;
    }

    return panAndScale;
  }

  calculateNodesAABB(nodes: readonly NodeGraphEditorNode[]): AABB {
    const firstNode = nodes[0];

    const aabb = {
      minX: firstNode.global.x,
      minY: firstNode.global.y,
      maxX: firstNode.global.x + firstNode.nodeSize.width,
      maxY: firstNode.global.y + firstNode.nodeSize.height
    };
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i];
      aabb.minX = Math.min(aabb.minX, n.global.x);
      aabb.minY = Math.min(aabb.minY, n.global.y);
      aabb.maxX = Math.max(aabb.maxX, n.global.x + n.nodeSize.width);
      aabb.maxY = Math.max(aabb.maxY, n.global.y + n.nodeSize.height);
    }

    return aabb;
  }

  nodesetFromSelection() {
    const nodes = this.selector.nodes;

    // Make sure all nodes can be copied
    const _invalid = nodes.filter((n) => !n.model.canBeCopied());
    if (_invalid.length !== 0) {
      PopupLayer.instance.showToast('One of more of these nodes cannot be copied');
      return;
    }

    // Update coordinates so they are pasted correctly
    const nodeModels = nodes.map((n) => {
      n.x = n.global.x;
      n.y = n.global.y;
      n.updateModel();
      return n.model;
    });

    const nodeset = this.model.getNodeSetWithNodes(nodeModels);
    nodeset.comments = this.commentLayer.getSelectedComments();

    return nodeset;
  }

  extractSelectionToComponent() {
    const nodeset = this.nodesetFromSelection();
    const selection = this.selector.nodes;

    const aabb = this.calculateNodesAABB(selection);

    const pos = {
      x: (aabb.minX + aabb.maxX) / 2 - NodeGraphEditorNode.size.width / 2,
      y: aabb.minY
    };

    extractToComponent(ProjectModel.instance, this.model, nodeset, selection, pos);

    this.clearSelection();
    this.relayout();
    this.repaint();
  }
}
