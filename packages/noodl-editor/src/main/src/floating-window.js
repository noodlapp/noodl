const { BrowserWindow, ipcMain } = require('electron');

function FloatingWindow() {
  this.window = null;
}

FloatingWindow.prototype.open = function ({ x, y, width, height, minWidth, minHeight, parent, url, alwaysShadow }) {
  if (this.window) return; //already open

  this.dockedInParent = true;
  const parentBounds = parent.getBounds();

  this.position = { x, y };

  this.alwaysShadow = alwaysShadow || false;

  this.window = new BrowserWindow({
    x: parentBounds.x + x,
    y: parentBounds.y + y,
    width,
    height,
    minWidth,
    minHeight,
    parent,
    resizable: true,
    frame: false,
    acceptFirstMouse: true,
    hasShadow: this.alwaysShadow,
    minimizable: false,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true,
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    },
    backgroundThrottling: false,
    closable: false,
    fullscreenable: false,
    backgroundColor: '#131313'
  });

  require('@electron/remote/main').enable(this.window.webContents);

  this.window.loadURL(url);

  this.onParentClosed = () => {
    this.close();
  };

  parent.on('closed', this.onParentClosed);

  if (process.platform !== 'darwin') {
    /* parent.on('move', () => {
      if(!this.dockedInParent || !this.window) return;

      const parentBounds = parent.getBounds();
      this.window.setPosition(parentBounds.x + this.position.x, parentBounds.y + this.position.y);
    });*/
  }

  this.window.on('move', () => {
    const parentBounds = parent.getBounds();
    const bounds = this.window.getBounds();

    const inside =
      bounds.x >= parentBounds.x &&
      bounds.x <= parentBounds.x + parentBounds.width &&
      bounds.y >= parentBounds.y &&
      bounds.y <= parentBounds.y + parentBounds.height;

    //set parent window to null when outside the editor so the viewer doesn't follow
    //the main window anymore.
    //This has no effect on windows, but since windows also doesn't move child
    //windows relative to the parent it's not needed
    if (process.platform !== 'win32') {
      if (!inside && this.dockedInParent) {
        this.window.setParentWindow(null);
      } else if (inside && !this.dockedInParent) {
        this.window.setParentWindow(parent);
      }
    }

    this.dockedInParent = inside;
    if (!this.alwaysShadow) {
      this.window.setHasShadow(!inside); //only works on osx
    }

    if (process.platform !== 'darwin') {
      //on macOS a child window moves with the parent, on the other platforms
      //we have implement it ourselves. Keep track of the relative position of the window
      this.position.x = bounds.x - parentBounds.x;
      this.position.y = bounds.y - parentBounds.y;
    }
  });
};

FloatingWindow.prototype.close = function () {
  if (!this.window || this.window.isDestroyed()) return;
  
  const parent = this.window.getParentWindow();
  if (parent) {
    parent.off('closed', this.onParentClosed);
  }
  this.window.destroy();
  this.window = null;
};

FloatingWindow.prototype.show = function () {
  if (!this.window || this.window.isVisible()) return;

  this.window.show();
  if (this.lastPosition) {
    this.window.setPosition(this.lastPosition[0], this.lastPosition[1], false);
    this.lastPosition = undefined;
  }
};

FloatingWindow.prototype.hide = function () {
  if (!this.window) return;

  this.lastPosition = this.window.getPosition();
  this.window.hide();
};

FloatingWindow.prototype.openDevTools = function () {
  if (!this.window) return;

  if (this.window.webContents.isDevToolsOpened()) {
    this.window.webContents.closeDevTools();
  }

  if (this.window.webContents.isDevToolsOpened()) {
    this.window.webContents.closeDevTools();
    this.window.webContents.openDevTools();
  } else {
    this.window.webContents.openDevTools();
  }
};

FloatingWindow.prototype.send = function (event, ...args) {
  this.window && this.window.webContents.send(event, ...args);
};

FloatingWindow.reload = function () {
  this.window && this.window.webContents.reload();
};

FloatingWindow.prototype.forwardIpcEvents = function (events) {
  for (const eventName of events) {
    ipcMain.on(eventName, (e, ...args) => {
      this.window && this.window.webContents.send(eventName, ...args);
    });
  }
};

FloatingWindow.prototype.isOpen = function () {
  return this.window ? true : false;
};

module.exports = FloatingWindow;
