const electron = require('electron');
const StorageApi = require('./src/main/src/StorageApi');
// Module to control application life.
const { app } = electron;
// Module to create native browser window.
const { BrowserWindow } = electron;

process.env.devMode = 'test';

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const remote = require('@electron/remote/main');
  remote.initialize();
  remote.enable(win.webContents);

  // and load the index.html of the app.
  win.loadURL('file:///' + process.cwd() + '/tests/SpecRunner.html');

  // Open the DevTools.
  win.webContents.openDevTools();

  // Make sure target="_blank" opens in external browser
  win.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    electron.shell.openExternal(url);
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  StorageApi.setup(win);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
});
