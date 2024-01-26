const Store = require('electron-store');
const { ipcMain, safeStorage } = require('electron');

function execute(method, args) {
  switch (method) {
    case 'decryptString':
      return safeStorage.decryptString(Buffer.from(args[0], 'latin1'));

    case 'encryptString':
      return safeStorage.encryptString(args[0]).toString('latin1');

    case 'isEncryptionAvailable':
      return safeStorage.isEncryptionAvailable();
  }
}

module.exports = {
  setup(mainWindow) {
    Store.initRenderer();

    ipcMain.on('storage-api', (_, { token, method, args }) => {
      try {
        const data = execute(method, args);
        mainWindow.webContents.send('storage-api', { token, data });
      } catch (error) {
        console.error('[Storage]', error);
      }
    });
  }
};
