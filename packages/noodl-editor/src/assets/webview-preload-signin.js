const { ipcRenderer } = require('electron');

global.NoodlEditor = global.Noodl = {
  SignIn: {
    success: function (tokens) {
      ipcRenderer.sendToHost('signInSuccessful', tokens);
    },
    showToast: function (message) {
      ipcRenderer.sendToHost('showToast', { message: message });
    },
    showActivity: function () {
      ipcRenderer.sendToHost('showActivity');
    },
    hideActivity: function () {
      ipcRenderer.sendToHost('hideActivity');
    }
  },
  Setup: {
    completed: function () {
      ipcRenderer.sendToHost('setupCompleted');
    },
    failed: function (message) {
      ipcRenderer.sendToHost('setupFailed', { message: message });
    },
    showActivity: function () {
      ipcRenderer.sendToHost('showActivity');
    },
    hideActivity: function () {
      ipcRenderer.sendToHost('hideActivity');
    }
  }
};
