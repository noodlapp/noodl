import { useNodeGraphContext } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import { useKeyboardCommands } from '@noodl-hooks/useKeyboardCommands';
import usePrevious from '@noodl-hooks/usePrevious';
import { OpenAiStore } from '@noodl-store/AiAssistantStore';
import { ipcRenderer } from 'electron';
import React, { useCallback, useEffect, useState } from 'react';

import { IDocumentProvider } from '@noodl-models/app_registry';
import { ProjectModel } from '@noodl-models/projectmodel';
import { SidebarModel } from '@noodl-models/sidebar';
import { SidebarModelEvent } from '@noodl-models/sidebar/sidebarmodel';
import { EditorSettings } from '@noodl-utils/editorsettings';
import { KeyCode, KeyMod } from '@noodl-utils/keyboard/KeyCode';
import { KeyboardCommand } from '@noodl-utils/keyboardhandler';

import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { FrameDivider, FrameDividerOwner } from '@noodl-core-ui/components/layout/FrameDivider';
import { MenuDialogWidth } from '@noodl-core-ui/components/popups/MenuDialog';

import { EventDispatcher } from '../../../../../shared/utils/EventDispatcher';
import Clippy from '../../Clippy/Clippy';
import { Frame } from '../../common/Frame';
import { EditorTopbar } from '../../EditorTopbar';
import { HelpCenter } from '../../HelpCenter';
import { NodeGraphEditor } from '../../nodegrapheditor';
import { showContextMenuInPopup } from '../../ShowContextMenuInPopup';
import { useCanvasView } from './hooks/UseCanvasView';
import { useCaptureThumbnails } from './hooks/UseCaptureThumbnails';
import { useImportNodeset } from './hooks/UseImportNodeset';
import { useRoutes } from './hooks/UseRoutes';
import { useSetupNodeGraph } from './hooks/UseSetupNodeGraph';
import { TitleBar } from './titlebar';

type DocumentLayout = 'horizontal' | 'vertical' | 'detachedPreview';

function EditorDocument() {
  const titlebarViewInstance = TitleBar.instance;

  const { nodeGraph } = useNodeGraphContext();
  // this never changes, so saving it in a state
  // this way it doesnt have to check for it every render
  const [isLesson] = useState(ProjectModel.instance.isLesson());

  useKeyboardCommands(() => createKeyboardCommands(nodeGraph), [nodeGraph]);

  const routes = ['/'].concat(useRoutes(ProjectModel.instance, EventDispatcher.instance));

  const [documentLayout, setDocumentLayout] = useState<DocumentLayout>(isLesson ? 'vertical' : 'horizontal');
  const previousDocumentLayout = usePrevious(documentLayout);

  const [zoomFactor, setZoomFactor] = useState(1);
  const [viewportSize, setViewportSize] = useState({ width: null, height: null, deviceName: null });
  const [frameDividerSize, setFrameDividerSize] = useState(undefined);

  const [enableAi, setEnableAi] = useState(OpenAiStore.getVersion() !== 'disabled');

  useEffect(() => {
    const group = {};
    EditorSettings.instance.on(
      'updated',
      () => {
        console.log('ai', OpenAiStore.getVersion());
        setEnableAi(OpenAiStore.getVersion() !== 'disabled');
      },
      group
    );
    return function () {
      EditorSettings.instance.off(group);
    };
  }, []);

  const [selectedNodeId, setSelectedNodeId] = useState(null); //The ID of the selected node, as highlighted by the viewer

  const [hasLoadedEditorSettings, setHasLoadedEditorSettings] = useState(false);

  const [_forceUpdate, setForceUpdate] = useState(0);

  const [navigationState, setNavigationState] = useState({
    canGoBack: false,
    canGoForward: false,
    route: '/'
  });

  const [previewMode, setPreviewMode] = useState(true);

  const viewerDetached = documentLayout === 'detachedPreview';

  const canvasView = useCanvasView(setNavigationState);

  useEffect(() => {
    if (import.meta.webpackHot) {
      import.meta.webpackHot.accept('../../Clippy/Clippy', () => {
        setForceUpdate(performance.now());
      });
    }
  });

  useKeyboardCommands(() => [
    {
      handler: () => setPreviewMode((previewMode) => !previewMode),
      keybinding: KeyMod.CtrlCmd | KeyCode.KEY_T
    }
  ]);

  useImportNodeset(nodeGraph);

  //close detached viewer when EditorDocmument unmounts
  useEffect(() => {
    return () => {
      ipcRenderer.send('viewer-attach', {});
    };
  }, []);

  useEffect(() => {
    if (!viewportSize.width && !zoomFactor) {
      setZoomFactor(1);
    }
  }, [zoomFactor, viewportSize]);

  useSetupNodeGraph(nodeGraph);

  //track which nodes is currently selected. A hack that relies on the side panel to tell us.
  useEffect(() => {
    const eventGroup = {};
    SidebarModel.instance.on(
      SidebarModelEvent.nodeSelected,
      (nodeId) => {
        setSelectedNodeId(nodeId);
      },
      eventGroup
    );

    SidebarModel.instance.on(
      SidebarModelEvent.activeChanged,
      (activeId) => {
        const isNodePanel = activeId === 'PropertyEditor' || activeId === 'PortEditor';
        if (isNodePanel === false) {
          setSelectedNodeId(null);
        }
      },
      eventGroup
    );

    return () => {
      SidebarModel.instance.off(eventGroup);
    };
  }, [nodeGraph]);

  useEffect(() => {
    if (viewerDetached) {
      ipcRenderer.send('viewer-detach', {
        zoomFactor,
        route: navigationState.route,
        viewportSize,
        inspectMode: previewMode ? false : true,
        selectedNodeId
      });

      const onViewerInspectNode = (_event, nodeId) => {
        EventDispatcher.instance.emit('inspectNodes', { nodeIds: [nodeId] });
      };

      ipcRenderer.on('viewer-inspect-node', onViewerInspectNode);
      return () => {
        ipcRenderer.off('viewer-inspect-node', onViewerInspectNode);
      };
    } else {
      ipcRenderer.send('viewer-attach', {});
    }
  }, [viewerDetached, canvasView]);

  useEffect(() => {
    const inspectMode = previewMode ? false : true;
    ipcRenderer.send('viewer-set-inspect-mode', inspectMode);
    canvasView?.setInspectMode(inspectMode);

    if (previewMode) {
      canvasView?.setNodeSelected(null);
      ipcRenderer.send('viewer-select-node', null);
    }
  }, [previewMode, canvasView]);

  useEffect(() => {
    if (!previewMode) {
      canvasView?.setNodeSelected(selectedNodeId);
      ipcRenderer.send('viewer-select-node', selectedNodeId);
    }
  }, [selectedNodeId, canvasView, previewMode]);

  const onRouteChanged = useCallback(
    (route) => {
      canvasView?.setCurrentRoute(route);
      ipcRenderer.send('viewer-set-route', route);
    },
    [canvasView]
  );

  const onUrlNavigateBack = useCallback(() => {
    ipcRenderer.send('viewer-navigate-back');
    canvasView?.navigateBack();
  }, [canvasView]);

  const onUrlNavigateForward = useCallback(() => {
    ipcRenderer.send('viewer-navigate-forward');
    canvasView?.navigateForward();
  }, [canvasView]);

  const onPreviewSizeChanged = useCallback((width, height, deviceName) => {
    setViewportSize({ width, height, deviceName });
  }, []);

  useEffect(() => {
    ipcRenderer.send('viewer-set-zoom-factor', zoomFactor);
    canvasView?.setZoomFactor(zoomFactor);
  }, [zoomFactor, canvasView]);

  useEffect(() => {
    canvasView?.setViewportSize(viewportSize);
    ipcRenderer.send('viewer-set-viewport-size', viewportSize);
  }, [viewportSize, canvasView]);

  useEffect(() => {
    const eventGroup = {};

    if (documentLayout === 'detachedPreview') {
      EventDispatcher.instance.on(
        'viewer-closed',
        () => {
          setDocumentLayout(previousDocumentLayout || 'horizontal');
        },
        eventGroup
      );
    }

    EventDispatcher.instance.on(
      'viewer-open-devtools',
      () => {
        if (documentLayout === 'detachedPreview') {
          ipcRenderer.send('viewer-open-devtools');
        } else {
          canvasView?.openDevTools();
        }
      },
      eventGroup
    );

    EventDispatcher.instance.on('viewer-refresh', () => canvasView?.refresh(), eventGroup);

    //refresh viewer when cloud services are changed
    ProjectModel.instance.on(
      'cloudServicesChanged',
      () => {
        EventDispatcher.instance.notifyListeners('viewer-refresh');
      },
      eventGroup
    );

    //this is sent by viewers in design mode, and lessons
    EventDispatcher.instance.on(
      'inspectNodes',
      (args) => {
        if (args.nodeIds.length === 1) {
          // Select node
          const node = ProjectModel.instance.findNodeWithId(args.nodeIds[0]);

          // Did we find a node that belongs to a component
          if (node && node.owner && node.owner.owner) {
            const component = node.owner.owner;
            nodeGraph.switchToComponent(component, { node: node, pushHistory: true });
          }
        } else {
          const nodes = args.nodeIds.map((id) => ProjectModel.instance.findNodeWithId(id)).filter((node) => !!node);

          const components = [nodes[0]];
          for (let i = 1; i < nodes.length; i++) {
            if (components[components.length - 1].owner.owner !== nodes[i].owner.owner) {
              components.push(nodes[i]);
            }
          }

          if (documentLayout === 'detachedPreview') {
            ipcRenderer.send(
              'viewer-show-inspect-menu',
              components.map((node) => ({
                label: node.owner.owner.name + ' - ' + node.label,
                nodeId: node.id
              }))
            );
          } else {
            const items = components.map((node) => ({
              label: node.owner.owner.name + ' - ' + node.label,
              onClick: () => {
                const component = node.owner.owner;
                nodeGraph.switchToComponent(component, { node: node, pushHistory: true });
              }
            }));
            showContextMenuInPopup({ title: 'Nodes behind cursor', items, width: MenuDialogWidth.Large });
          }
        }
      },
      eventGroup
    );

    //used by lessons
    EventDispatcher.instance.on(
      'setPreviewRoute',
      (args) => {
        onRouteChanged(args.url);
      },
      eventGroup
    );

    EventDispatcher.instance.on(
      'selectComponent',
      (args) => {
        const component = ProjectModel.instance.getComponentWithName(args.componentName);
        if (component) {
          nodeGraph.switchToComponent(component, { pushHistory: true });
        }
      },
      eventGroup
    );

    return () => {
      EventDispatcher.instance.off(eventGroup);
      ProjectModel.instance.off(ProjectModel);
    };
  }, [documentLayout, canvasView, previewMode, nodeGraph]);

  useEffect(() => {
    const onViewerNavigationState = (event, state) => {
      setNavigationState(state);
      //make sure canvas view is updated as well so the route matches if layout is changed
      canvasView?.setCurrentRoute(state.route);
    };

    ipcRenderer.on('viewer-navigation-state', onViewerNavigationState);

    return () => {
      ipcRenderer.off('viewer-navigation-state', onViewerNavigationState);
    };
  }, [canvasView]);

  // Save settings
  useEffect(() => {
    if (!hasLoadedEditorSettings) {
      return;
    }

    EditorSettings.instance.setMerge(ProjectModel.instance.id, {
      documentLayout,
      viewportSize,
      frameDividerSize,
      previewMode
    });

    const eventGroup = {};

    nodeGraph.on(
      'activeComponentChanged',
      ({ model }) =>
        EditorSettings.instance.setMerge(ProjectModel.instance.id, { selectedComponentName: model.fullName }),
      eventGroup
    );

    return () => {
      nodeGraph.off(eventGroup);
    };
  }, [hasLoadedEditorSettings, documentLayout, viewportSize, frameDividerSize, previewMode, nodeGraph]);

  // Apply settings
  useEffect(() => {
    setHasLoadedEditorSettings(true);

    const settings = EditorSettings.instance.get(ProjectModel.instance.id);

    if (!settings) {
      return;
    }

    if (settings.documentLayout) {
      setDocumentLayout(settings.documentLayout);
    }

    if (settings.viewportSize) {
      setViewportSize(settings.viewportSize);
    }

    if (settings.frameDividerSize) {
      setFrameDividerSize(settings.frameDividerSize);
    }

    // setEnableAi(settings[AI_ASSISTANT_ENABLED_KEY]);

    if (settings.selectedComponentName) {
      const component = ProjectModel.instance.getComponentWithName(settings.selectedComponentName);
      if (component) {
        nodeGraph.switchToComponent(component, { replaceHistory: true });
      }
    }

    setPreviewMode(settings.previewMode ? true : false);
  }, [nodeGraph]);

  // useEffect(() => {
  //   const func = () => {
  //     setEnableAi(!!EditorSettings.instance.get(AI_ASSISTANT_ENABLED_KEY));
  //   };
  //
  //   func();
  //
  //   EditorSettings.instance.on('updated', func, group);
  //   return function () {
  //     EditorSettings.instance.off(group);
  //   };
  // }, []);

  useCaptureThumbnails(canvasView, viewerDetached);

  return (
    <Container direction={ContainerDirection.Vertical} isFill>
      <EditorTopbar
        instance={titlebarViewInstance}
        routes={routes}
        onRouteChanged={onRouteChanged}
        setDocumentLayout={setDocumentLayout}
        documentLayout={documentLayout}
        zoomFactor={zoomFactor}
        setZoomFactor={setZoomFactor}
        onUrlNavigateBack={onUrlNavigateBack}
        onUrlNavigateForward={onUrlNavigateForward}
        navigationState={navigationState}
        onPreviewSizeChanged={onPreviewSizeChanged}
        previewSize={viewportSize}
        onPreviewModeChanged={setPreviewMode}
        previewMode={previewMode}
        nodeGraph={nodeGraph}
        deployIsDisabled={ProjectModel.instance.isLesson()}
      />
      {hasLoadedEditorSettings && (
        <ViewComponent
          documentLayout={documentLayout}
          canvasViewInstance={canvasView}
          nodeGraphEditorInstance={nodeGraph}
          frameDividerSize={frameDividerSize}
          onSizeUpdated={(size) => {
            setFrameDividerSize(size);
          }}
        />
      )}

      <HelpCenter />
      {enableAi && <Clippy />}
    </Container>
  );
}

function ViewComponent({
  canvasViewInstance,
  documentLayout,
  nodeGraphEditorInstance,
  onSizeUpdated,
  frameDividerSize
}: TSFixme) {
  const [frameBounds, setFrameBounds] = useState(undefined);

  const horizontal = documentLayout === 'horizontal';
  const totalSize = frameBounds ? (horizontal ? frameBounds.height : frameBounds.width) : undefined;

  if (documentLayout === 'detachedPreview') {
    return <Frame instance={nodeGraphEditorInstance} onResize={(bounds) => nodeGraphEditorInstance.resize(bounds)} />;
  } else {
    const firstInstance = horizontal ? canvasViewInstance : nodeGraphEditorInstance;
    const secondInstance = horizontal ? nodeGraphEditorInstance : canvasViewInstance;

    return (
      <FrameDivider
        splitOwner={horizontal ? FrameDividerOwner.First : FrameDividerOwner.Second}
        horizontal={!horizontal}
        first={<Frame instance={firstInstance} onResize={(bounds) => firstInstance.resize(bounds)} />}
        second={<Frame instance={secondInstance} onResize={(bounds) => secondInstance.resize(bounds)} />}
        sizeMin={100}
        sizeMax={totalSize ? totalSize - 100 : undefined}
        size={frameDividerSize}
        onSizeChanged={(size) => {
          onSizeUpdated(size);
        }}
        onBoundsChanged={setFrameBounds}
      />
    );
  }
}

function createKeyboardCommands(nodeGraph: NodeGraphEditor) {
  const copy: KeyboardCommand = {
    handler: () => nodeGraph.copy(),
    keybinding: KeyMod.CtrlCmd | KeyCode.KEY_C
  };

  const paste: KeyboardCommand = {
    handler: () => nodeGraph.paste(),
    keybinding: KeyMod.CtrlCmd | KeyCode.KEY_V
  };

  const cut: KeyboardCommand = {
    handler: () => nodeGraph.cut(),
    keybinding: KeyMod.CtrlCmd | KeyCode.KEY_X
  };

  const undo: KeyboardCommand = {
    handler: () => nodeGraph.undo(),
    keybinding: KeyMod.CtrlCmd | KeyCode.KEY_Z
  };

  const redo: KeyboardCommand = {
    handler: () => nodeGraph.redo(),
    keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_Z
  };

  const navBack: KeyboardCommand = {
    handler: () => nodeGraph.navigationHistory.goBack(),
    keybinding: KeyMod.CtrlCmd | KeyCode.US_OPEN_SQUARE_BRACKET
  };

  const navForward: KeyboardCommand = {
    handler: () => nodeGraph.navigationHistory.goForward(),
    keybinding: KeyMod.CtrlCmd | KeyCode.US_CLOSE_SQUARE_BRACKET
  };

  const deleteWithBackspace: KeyboardCommand = {
    handler: () => nodeGraph.delete(),
    keybinding: KeyCode.Backspace
  };

  const deleteWithDel: KeyboardCommand = {
    handler: () => nodeGraph.delete(),
    keybinding: KeyCode.Delete
  };

  const createComment: KeyboardCommand = {
    handler: () =>
      nodeGraph.activeComponent.graph.commentsModel.addComment(
        {
          text: '',
          fill: true,
          width: 150,
          height: 100,
          x: nodeGraph.latestMousePos.x,
          y: nodeGraph.latestMousePos.y
        },
        { undo: true, label: 'add comment', focusComment: true }
      ),
    keybinding: KeyMod.CtrlCmd | KeyCode.US_SLASH
  };

  return [copy, paste, cut, undo, redo, navBack, navForward, deleteWithBackspace, deleteWithDel, createComment];
}

export class EditorDocumentProvider implements IDocumentProvider {
  public static ID = 'EditorDocumentProvider';

  getComponent() {
    // React Component of the editor view (canvas, and node graph)
    return EditorDocument;
  }
}
