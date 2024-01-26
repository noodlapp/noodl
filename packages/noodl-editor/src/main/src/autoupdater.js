const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
//const {autoUpdateBaseUrl} = require('../../shared/config/config');

function setupAutoUpdate(window) {
  if (process.env.autoUpdate === 'no') return;

  if (process.platform === 'linux') {
    return;
  }

  function _checkForUpdates() {
    try {
      autoUpdater.checkForUpdates();
    } catch (e) {
      // Failed to check for updates, try again later
      setTimeout(() => {
        _checkForUpdates();
      }, 60 * 1000);
    }
  }
  _checkForUpdates();

  autoUpdater.addListener('update-available', (event) => {
    console.log('A new update is available, downloading...');
  });

  autoUpdater.addListener('update-downloaded', (event) => {
    window.webContents.send('showAutoUpdatePopup');

    return true;
  });

  ipcMain.on('autoUpdatePopupClosed', (event, restartNow) => {
    if (restartNow) {
      autoUpdater.quitAndInstall();
    }
  });

  /* autoUpdater.addListener("error", (error) => {
    console.log('Auto update error', error);
  });*/

  autoUpdater.addListener('update-not-available', () => {
    setTimeout(() => {
      _checkForUpdates();
    }, 60 * 1000);
  });

  autoUpdater.addListener('error', (event) => {
    // There was an error while trying to update, try again
    console.log('Error while auto updating, trying again in a while...');
    setTimeout(() => {
      _checkForUpdates();
    }, 60 * 1000);
  });
}

module.exports = {
  setupAutoUpdate
};
