import React from 'react';

import { NoHomeError } from './components/common/NoHomeError';
import GraphWarnings from './graph-warnings';
import { Highlighter } from './highlighter';
import Inspector from './inspector';
import NoodlJSAPI from './noodl-js-api';
import projectSettings from './project-settings';
import { createNodeFromReactComponent } from './react-component-node';
import registerNodes from './register-nodes';
import Styles from './styles';

if (typeof window !== 'undefined' && window.NoodlEditor) {
  window.NoodlEditorInspectorAPI = {
    enabled: false,
    inspector: null,
    setInspector(inspector) {
      this.inspector = inspector;
      this.enabled ? this.inspector.enable() : this.inspector.disable();
    },
    setEnabled(enabled) {
      this.enabled = enabled;
      if (this.inspector) {
        this.enabled ? this.inspector.enable() : this.inspector.disable();
      }

      if (window.NoodlEditorHighlightAPI.highlighter) {
        window.NoodlEditorHighlightAPI.highlighter.setWindowSelected(enabled);
      }
    }
  };

  window.NoodlEditorHighlightAPI = {
    highlighter: null,
    setHighlighter(highlighter) {
      this.highlighter = highlighter;

      this.highlighter.setWindowSelected(window.NoodlEditorInspectorAPI.enabled);
    },
    selectNode(nodeId) {
      this.highlighter.deselectNodes();

      if (nodeId && nodeId !== 'null') {
        this.highlighter.selectNodesWithId(nodeId);
      } else if (window.NoodlEditorInspectorAPI.enabled) {
        this.highlighter.setWindowSelected(true);
      }
    }
  };
}

export function ssrSetupRuntime(noodlRuntime, noodlModules, projectData) {
  registerNodes(noodlRuntime);

  // Noodl static API
  NoodlJSAPI(noodlRuntime);

  noodlRuntime.setProjectSettings(projectSettings);

  // Register module nodes
  if (noodlModules) {
    for (const module of noodlModules) {
      if (module.reactNodes) {
        const reactNodes = [];
        for (const nodeDefinition of module.reactNodes) {
          reactNodes.push(createNodeFromReactComponent(nodeDefinition));
        }
        const nodes = module.nodes || [];
        module.nodes = nodes.concat(reactNodes);
      }
      noodlRuntime.registerModule(module);
    }
  }

  const styles = new Styles({
    graphModel: noodlRuntime.graphModel,
    getNodeScope: () => noodlRuntime.context.rootComponent && noodlRuntime.context.rootComponent.nodeScope,
    nodeRegister: noodlRuntime.context.nodeRegister
  });

  //make the styles available to all nodes via `this.context.styles`
  noodlRuntime.context.styles = styles;

  noodlRuntime.setData(projectData);
  noodlRuntime._disableLoad = true;
}

export default class Viewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      popups: []
    };

    const { noodlRuntime } = props;
    this.runningDeployed = this.props.projectData !== undefined;
    this.focusedNoodlNodes = [];

    noodlRuntime.context.setNodeFocused = this.setNodeFocused.bind(this);

    const enableDebugInspectors =
      (typeof document !== 'undefined' && document.location.href.indexOf('forceDebugger=true') !== -1) ||
      Noodl.enableDebugInspectors;
    noodlRuntime.setDebugInspectorsEnabled(enableDebugInspectors);

    noodlRuntime.context.setPopupCallbacks({
      onShow: (popup) => {
        const newPopupArray = this.state.popups.concat([popup]);

        const bodyScroll = noodlRuntime.getProjectSettings().bodyScroll;

        //Disable body scroll when showing a popup
        if (bodyScroll && newPopupArray.length === 1) {
          document.body.style.width = document.body.clientWidth + 'px';
          document.body.style.top = `-${window.scrollY}px`;
          document.body.style.position = 'fixed';
        }

        this.setState({
          popups: newPopupArray
        });
      },
      onClose: (popup) => {
        const newPopupArray = this.state.popups.filter((p) => p !== popup);

        this.setState({
          popups: newPopupArray
        });

        const bodyScroll = noodlRuntime.getProjectSettings().bodyScroll;

        //Enable body scroll when hiding all popups
        if (bodyScroll && newPopupArray.length === 0) {
          const scrollY = document.body.style.top;
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '100%';
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    });

    registerNodes(noodlRuntime);

    // Noodl static API
    NoodlJSAPI(noodlRuntime);

    noodlRuntime.setProjectSettings(projectSettings);

    // Register module nodes
    if (this.props.noodlModules) {
      for (const module of this.props.noodlModules) {
        if (module.reactNodes) {
          const reactNodes = [];
          for (const nodeDefinition of module.reactNodes) {
            reactNodes.push(createNodeFromReactComponent(nodeDefinition));
          }
          const nodes = module.nodes || [];
          module.nodes = nodes.concat(reactNodes);
        }
        noodlRuntime.registerModule(module);
      }
    }

    noodlRuntime.eventEmitter.on('rootComponentUpdated', () => {
      //wait until next frame to trigger a react update, so inputs etc have a chance to settle
      //(forceUpdate is synchronous)
      requestAnimationFrame(() => this.forceUpdate());
    });

    noodlRuntime.graphModel.on('projectSettingsChanged', (settings) => {
      // Suppport SSR
      if (typeof document === 'undefined') return;

      if (settings.bodyScroll) {
        document.body.classList.add('body-scroll');
      } else {
        document.body.classList.remove('body-scroll');
      }
    });

    this.styles = new Styles({
      graphModel: noodlRuntime.graphModel,
      getNodeScope: () => noodlRuntime.context.rootComponent && noodlRuntime.context.rootComponent.nodeScope,
      nodeRegister: noodlRuntime.context.nodeRegister
    });

    //make the styles available to all nodes via `this.context.styles`
    noodlRuntime.context.styles = this.styles;

    this.state.waitingForExport = !this.runningDeployed;

    if (this.runningDeployed) {
      this.props.noodlRuntime.setData(this.props.projectData);

      //start pre-fetching the rest of the bundles after a while, if there arent too many of them
      const allBundles = Object.keys(this.props.projectData.componentIndex);
      if (allBundles.length < 30) {
        setTimeout(() => {
          this.props.noodlRuntime.prefetchBundles(allBundles, 3);
        }, 10000);
      }
    } else {
      noodlRuntime.graphModel.on('editorImportComplete', () => {
        this.setState({ waitingForExport: false });
      });
      this.connectToEditor();
    }

    this.focusedNoodlNodes = [];
  }

  connectToEditor() {
    const { noodlRuntime } = this.props;

    // Remove hash if it is in location href
    var href =
      (Noodl.host || location.protocol + '//' + location.host) +
      location.pathname +
      (location.search ? location.search : '');

    const address = href.replace('http', 'ws');
    noodlRuntime.connectToEditor(address);

    this.highlightedNodes = new Map();
    this.isUpdatingHighlights = false;

    if (typeof window !== 'undefined' && window.NoodlEditor) {
      this.highlighter = new Highlighter(noodlRuntime);
      NoodlEditorHighlightAPI.setHighlighter(this.highlighter);

      noodlRuntime.editorConnection.on('hoverStart', (id) => {
        this.highlighter.highlightNodesWithId(id);
      });
      noodlRuntime.editorConnection.on('hoverEnd', (id) => {
        this.highlighter.disableHighlight();
      });

      this.inspector = new Inspector({
        onDisableHighlight: () => this.highlighter.disableHighlight(),
        onHighlight: (id) => this.highlighter.highlightNodesWithId(id),
        onInspect: (ids) => {
          NoodlEditor.inspectNodes(ids);
        }
      });
      NoodlEditorInspectorAPI.setInspector(this.inspector);
    }

    noodlRuntime.editorConnection.on('debuggingEnabledChanged', (enabled) => {
      noodlRuntime.setDebugInspectorsEnabled(enabled);
    });

    this.graphWarnings = new GraphWarnings(noodlRuntime.graphModel, noodlRuntime.editorConnection);
  }

  setNodeFocused(node, focused) {
    if (focused && this.focusedNoodlNodes.indexOf(node) === -1) {
      //blur nodes that don't contain this new node
      this.focusedNoodlNodes
        .filter((focusedNode) => !focusedNode.contains(node))
        .forEach((blurredNode) => {
          blurredNode._blur();
        });

      node._focus();
      this.focusedNoodlNodes.push(node);
    } else if (!focused) {
      const index = this.focusedNoodlNodes.indexOf(node);
      if (index !== -1) {
        return;
      }

      node._blur();

      //also blur nodes that contain this node
      this.focusedNoodlNodes
        .filter((focusedNode) => focusedNode.contains(node))
        .forEach((blurredNode) => {
          blurredNode._blur();
        });

      this.focusedNoodlNodes.splice(index, 1);
    }
  }

  onClickCapture(e) {
    const focusedNoodlNodes = [];

    //walk up the dom tree and collect all noodl nodes
    let elem = e.target;
    while (elem) {
      if (elem.noodlNode && elem.noodlNode._focus) focusedNoodlNodes.push(elem.noodlNode);
      elem = elem.parentNode;
    }

    //blur nodes that weren't part of this click
    this.focusedNoodlNodes.filter((node) => focusedNoodlNodes.indexOf(node) === -1).forEach((node) => node._blur());

    //focus all new focused nodes
    focusedNoodlNodes.filter((node) => this.focusedNoodlNodes.indexOf(node) === -1).forEach((node) => node._focus());

    this.focusedNoodlNodes = focusedNoodlNodes;
  }

  render() {
    const rootComponent = this.props.noodlRuntime.rootComponent;
    if (this.state.waitingForExport) return null;

    if (!rootComponent) {
      if (this.runningDeployed) {
        return null;
      } else {
        return NoHomeError();
      }
    }

    const bodyScroll = this.props.noodlRuntime.getProjectSettings().bodyScroll;

    if (bodyScroll) {
      const style = {
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        alignSelf: 'stretch',
        display: 'flex',
        flexDirection: 'column'
      };
      return (
        <div style={style} onClickCapture={(e) => this.onClickCapture(e)}>
          <div style={{ ...style, isolation: 'isolate' }}>{rootComponent.render()}</div>
          {this.state.popups.length ? (
            <div style={{ ...style, isolation: 'isolate' }}>{this.state.popups.map((p) => p.render())}</div>
          ) : null}
        </div>
      );
    } else {
      return (
        <div
          style={{
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            width: '100%',
            height: '100%'
          }}
          onClickCapture={(e) => this.onClickCapture(e)}
        >
          {rootComponent.render()}
          {this.state.popups.map((p) => p.render())}
        </div>
      );
    }
  }
}
