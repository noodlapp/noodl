const View = require('../../../../shared/view');
const Config = require('../../../../shared/config/config');
const ViewerTemplate = require('../templates/viewer.html');
const { ipcRenderer } = require('electron');

const remote = require('@electron/remote');

require('@noodl/platform-electron');
require('../../../../editor/src/styles/custom-properties/colors.css');

const { platform, PlatformOS } = require('@noodl/platform');
const { CanvasView } = require('../../../../editor/src/views/VisualCanvas/CanvasView');
const { showContextMenuInPopup } = require('../../../../editor/src/views/ShowContextMenuInPopup');

const MenuDialogWidth = require('@noodl-core-ui/components/popups/MenuDialog');

class Viewer extends View {
  constructor() {
    super();

    // remote.getCurrentWindow().webContents.openDevTools();

    this.isWindows = platform.os === PlatformOS.Windows;

    this.canvasView = new CanvasView({
      onNavigationStateChanged: (state) => {
        ipcRenderer.send('viewer-navigation-state', state);
      }
    });

    ipcRenderer.on('viewer-refresh', () => {
      this.canvasView.refresh();
      ipcRenderer.send('viewer-refreshed');
    });

    ipcRenderer.on('viewer-focus', () => {
      const window = remote.getCurrentWindow();
      if (window && window.focusable) {
        window.focus();
      }
    });

    ipcRenderer.on('viewer-open-devtools', () => {
      this.canvasView.openDevTools();
    });

    ipcRenderer.on('viewer-select-node', (sender, nodeId) => {
      this.canvasView.setNodeSelected(nodeId);
    });

    ipcRenderer.on('viewer-set-zoom-factor', (sender, zf) => {
      this.canvasView.setZoomFactor(zf);
    });

    ipcRenderer.on('viewer-set-route', (sender, route) => {
      this.canvasView.setCurrentRoute(route);
    });

    ipcRenderer.on('viewer-set-inspect-mode', (sender, inspectMode) => {
      this.canvasView.setInspectMode(inspectMode);
    });

    ipcRenderer.on('viewer-set-viewport-size', (sender, viewportSize) => {
      this.canvasView.setViewportSize(viewportSize);
    });

    ipcRenderer.on('viewer-navigate-forward', (sender) => {
      this.canvasView.navigateForward();
    });

    ipcRenderer.on('viewer-navigate-back', (sender) => {
      this.canvasView.navigateBack();
    });

    ipcRenderer.on('viewer-capture-thumb', async ({ sender }) => {
      // Capture a snapshot of the viewer
      const image = await this.canvasView.captureThumbnail();

      if (image) {
        sender.send('viewer-capture-thumb-reply', image.toDataURL());
      }
    });

    ipcRenderer.on('viewer-show-inspect-menu', ({ sender }, listItems) => {
      const items = listItems.map((item) => ({
        label: item.label,
        onClick: () => {
          sender.send('viewer-inspect-node', item.nodeId);
        }
      }));
      showContextMenuInPopup({ title: 'Nodes behind cursor', items, width: MenuDialogWidth.Large });
    });
  }

  render() {
    const el = this.bindView($(ViewerTemplate), this);
    if (this.el) this.el.append(el);
    else this.el = el;

    this.$('.webview-container').append(this.canvasView.render());
    //make sure webview is never blurred so keyboard shortcuts always work (the webview is sending key input to the editor)
    setTimeout(() => {
      //give react a chance to render before focusing the first time
      this.$('.webview-container webview')?.focus();
    }, 100);
    this.$('.webview-container webview').on('blur', (e) => {
      e.target.focus();
    });

    getLocalIPs((result) => {
      const ipAddress = result && result.length > 0 ? result[result.length - 1] : 'localhost';
      const protocol = process.env.ssl ? 'https://' : 'http://';
      const webUrl = `${protocol}${ipAddress}:${Config.PreviewServer.port}`;
      this.$('.weburl').text(webUrl).attr('href', webUrl);
    });

    this._blockClicksAfterMovingWindow();

    return this.el;
  }
  _blockClicksAfterMovingWindow() {
    remote.getCurrentWindow().on('moved', () => {
      this.blockNextClick = true;
    });

    document.addEventListener(
      'click',
      (e) => {
        if (this.blockNextClick) {
          e.stopPropagation();
          this.blockNextClick = false;
        }
      },
      true
    ); //capture phase
  }
  onAttachIconClicked() {
    ipcRenderer.send('viewer-attach');
  }
  onTitleClicked() {
    platform.openExternal(this.$('.title').text());
  }
}

function getLocalIPs(callback) {
  let ips = [];

  const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

  const pc = new RTCPeerConnection({
    // Don't specify any stun/turn servers, otherwise you will
    // also find your public IP addresses.
    iceServers: []
  });
  // Add a media line, this is needed to activate candidate gathering.
  pc.createDataChannel('');

  // onicecandidate is triggered whenever a candidate has been found.
  pc.onicecandidate = function (e) {
    if (!e.candidate) {
      // Candidate gathering completed.
      pc.close();
      callback(ips);
      return;
    }
    var ip = /^candidate:.+ (\S+) \d+ typ/.exec(e.candidate.candidate)[1];
    if (ips.indexOf(ip) === -1)
      // avoid duplicate entries (tcp/udp)
      ips.push(ip);
  };
  pc.createOffer(
    function (sdp) {
      pc.setLocalDescription(sdp);
    },
    function onerror() {}
  );
}

module.exports = Viewer;
