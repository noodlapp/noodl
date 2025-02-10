import { ipcRenderer } from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import { platform } from '@noodl/platform';

import { EventDispatcher } from '../../../../shared/utils/EventDispatcher';
import View from '../../../../shared/view';
import { VisualCanvas } from './VisualCanvas';

export class CanvasView extends View {
  webview: Electron.WebviewTag;
  webviewDomReady: boolean;

  zoomFactor: number;

  viewportWidth: number;
  viewportHeight: number;

  inspectMode: boolean;
  selectedNodeId: string | null;

  props: {
    deviceName?: string;
    zoom?: number;
    onWebView: (webview: Electron.WebviewTag) => void;
  };

  _onEditorApiResponse: (event: any, args: any) => void;

  onNavigationStateChanged: ({
    route,
    canGoBack,
    canGoForward
  }: {
    route: string;
    canGoBack: boolean;
    canGoForward: boolean;
  }) => void;

  constructor({ onNavigationStateChanged }) {
    super();

    this.zoomFactor = 1;
    this.inspectMode = false;
    this.viewportWidth = null;

    this.onNavigationStateChanged = (state) => {
      onNavigationStateChanged(state);
      window.noodlEditorPreviewRoute = state.route.substring(0, state.route.indexOf('?'));
      EventDispatcher.instance.emit('viewer-navigated', state.route);
    };

    this.viewportHeight = null;

    this.props = {
      onWebView: (webview: Electron.WebviewTag) => {
        if (webview) {
          this._setupWebview(webview);
        } else {
          this.webviewDomReady = false;
          this.webview = null;
        }
      }
    };
  }
  _setupWebview(webview: Electron.WebviewTag) {
    this.webview = webview;

    webview.preload = platform.getAppPath() + 'src/assets/webview-preload-viewer.js';

    webview.addEventListener('dom-ready', async () => {
      this.webviewDomReady = true;

      const isValidSession = await this.webview.executeJavaScript(`typeof NoodlEditorInspectorAPI !== 'undefined'`);
      if (!isValidSession) {
        // TODO: When loading a page with "Path" navigation and you have a "."
        // (dot) in the URL our web server will return 404, this is technically
        // a crash, right? This can also be a file, and we have no file preview yet.

        // TODO: there are use cases for invalid sessions, such as a google auth login flow that uses redirect.
        // Let's allow it for now
        // this.webview.dispatchEvent(new Event('crashed'));
        return;
      }

      const code = `
        document.addEventListener('keydown', (e) => {
          const hasFocusedElement = document.querySelector(':focus') ? true : false;
          if (!hasFocusedElement && (e.metaKey || e.ctrlKey || e.shiftKey)) {
            NoodlEditor.keyDown({
              metaKey: e.metaKey,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
              keyCode: e.keyCode,
              key: e.key
            });
          }
        });

        // Patch to open the next window in the same webview.
        // Since we don't support multiple webviews.
        window.open = function (url) {
          window.location.href = url;
        }
      `;

      webview.executeJavaScript(code);

      this.webview.executeJavaScript(`NoodlEditorInspectorAPI.setEnabled(${this.inspectMode})`);

      if (this.selectedNodeId) {
        this.webview.executeJavaScript(`NoodlEditorHighlightAPI.selectNode('${this.selectedNodeId}')`);
      }

      this.updateViewportSize();
    });

    webview.addEventListener('load-commit', (event) => {
      if (event.isMainFrame === false) {
        return;
      }

      const protocol = process.env.ssl ? 'https://' : 'http://';
      const port = process.env.NOODLPORT || 8574;
      const urlPrefix = protocol + 'localhost:' + port;

      const route = event.url.startsWith(urlPrefix) ? event.url.substring(urlPrefix.length) : event.url;

      this.onNavigationStateChanged &&
        this.onNavigationStateChanged({ route, canGoBack: webview.canGoBack(), canGoForward: webview.canGoForward() });
    });

    this.setCurrentRoute('/');
  }
  resize() {
    this.updateViewportSize();
  }
  render() {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.overflow = 'hidden';

    this.el = $(div);

    // If there is an api response from the main thread, pass it along to the webview
    this._onEditorApiResponse = (event, args) => {
      this.tryWebviewCall(() => {
        this.webview.send('editor-api-response', args);
      });
    };

    ipcRenderer.on('editor-api-response', this._onEditorApiResponse);

    this.renderReact();

    return this.el;
  }
  renderReact() {
    ReactDOM.render(React.createElement(VisualCanvas, this.props), this.el[0]);
  }
  setCurrentRoute(route: string) {
    const protocol = process.env.ssl ? 'https://' : 'http://';
    const port = process.env.NOODLPORT || 8574;

    this.webview.src = protocol + 'localhost:' + port + route;
    window.noodlEditorPreviewRoute = route;
    EventDispatcher.instance.emit('viewer-navigated', route);
  }
  dispose() {
    if (this.webview) {
      this.tryWebviewCall(() => {
        if (this.webview.isDevToolsOpened()) {
          this.webview.closeDevTools();
        }
      });
    }

    ReactDOM.unmountComponentAtNode(this.el[0]);
    ipcRenderer.off('editor-api-response', this._onEditorApiResponse);
  }
  refresh() {
    //set back to root to reset any navigation that's been done
    // const protocol = process.env.ssl ? 'https://' : 'http://';
    // const port = process.env.NOODLPORT || 8574;
    // this.webview.src = protocol + 'localhost:' + port;

    this.tryWebviewCall(() => {
      this.webview.reloadIgnoringCache();
    });

    EventDispatcher.instance.emit('viewer-refreshed');
  }
  openDevTools() {
    if (this.webview.isDevToolsOpened()) {
      this.webview.closeDevTools();
    }

    this.webview.openDevTools();
  }

  setZoomFactor(zoomFactor: number) {
    this.zoomFactor = zoomFactor;
    this.updateViewportSize();
  }

  navigateBack() {
    this.tryWebviewCall(() => {
      this.webview.goBack();
    });
  }

  navigateForward() {
    this.tryWebviewCall(() => {
      this.webview.goForward();
    });
  }

  setViewportSize({ width, height, deviceName }: { width: number; height: number; deviceName?: string }) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.props.deviceName = deviceName;
    this.renderReact();
    this.updateViewportSize();
  }

  private updateViewportSize() {
    if (!this.webview) {
      return;
    }

    const width = this.viewportWidth;
    const height = this.viewportHeight;

    if (width !== null) {
      let zoom = this.zoomFactor;

      if (!zoom) {
        const rect = this.webview.parentElement.getBoundingClientRect();

        const aspectX = rect.width / width;
        const aspectY = rect.height / height;

        const zoomFit = Math.min(aspectX, aspectY); //zoom level that maximizes the viewport
        zoom = Math.min(1, zoomFit); //cap the zoom so it can't zoom in > 1 since it'll become blurry
      }

      this.webview.style.width = Math.floor(zoom * width) + 'px';
      this.webview.style.height = Math.floor(zoom * height) + 'px';

      this.props.zoom = zoom;
      this.renderReact();

      this.tryWebviewCall(() => this.webview.executeJavaScript(`document.body.style.zoom = '${zoom}'`));
    } else {
      const zoom = this.zoomFactor || 1;
      this.tryWebviewCall(() => this.webview.executeJavaScript(`document.body.style.zoom = '${zoom}'`));

      this.webview.style.width = '100%';
      this.webview.style.height = '100%';
      this.props.zoom = zoom;
      this.renderReact();
    }
  }

  setInspectMode(enabled: boolean) {
    this.inspectMode = enabled;
    this.tryWebviewCall(() => {
      this.webview.executeJavaScript(`NoodlEditorInspectorAPI.setEnabled(${enabled})`);
      this.webview.executeJavaScript(`NoodlEditorHighlightAPI.selectNode(null)`);
    });
  }

  setNodeSelected(nodeId: string) {
    this.selectedNodeId = nodeId;
    this.tryWebviewCall(() => {
      this.webview.executeJavaScript(`NoodlEditorHighlightAPI.selectNode('${nodeId}')`);
    });
  }

  async captureThumbnail() {
    if (!this.webviewDomReady || !this.webview?.isConnected) {
      return null;
    }

    const nativeImage = await this.webview.capturePage();

    const size = nativeImage.getSize();
    const canvasWidth = size.width;
    const canvasHeight = size.height;
    let thumbHeight, thumbWidth;

    if (canvasWidth > canvasHeight) {
      thumbWidth = Math.round(400 * (canvasWidth / canvasHeight));
      thumbHeight = 400;
    } else {
      thumbWidth = 400;
      thumbHeight = Math.round(400 * (canvasHeight / canvasWidth));
    }

    const resizedImage = nativeImage.resize({
      width: thumbWidth,
      height: thumbHeight
    });

    return resizedImage;
  }

  private tryWebviewCall(func) {
    if (this.webviewDomReady && this.webview.isConnected) {
      try {
        func();
      } catch (e) {
        if (!e.toString().includes('The WebView must be attached to the DOM')) {
          throw e;
        }
      }
    }
  }
}
