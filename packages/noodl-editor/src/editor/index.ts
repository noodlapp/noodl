import * as remote from '@electron/remote';
import { ipcRenderer } from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';

import './process-setup';

import { EventDispatcher } from '../shared/utils/EventDispatcher';
import { NodeLibrary } from './src/models/nodelibrary';
import { ProjectModel } from './src/models/projectmodel';

//Design tokens for later
// import '../../../noodl-core-ui/src/styles/custom-properties/animations.css';
// import '../../../noodl-core-ui/src/styles/custom-properties/fonts.css';
// import '../../../noodl-core-ui/src/styles/custom-properties/colors.css';
import '../editor/src/styles/custom-properties/animations.css';
import '../editor/src/styles/custom-properties/fonts.css';
import '../editor/src/styles/custom-properties/colors.css';

import Router from './src/router';

ipcRenderer.on('open-noodl-uri', async (event, uri) => {
  if (uri.startsWith('noodl:import/http')) {
    console.log('import: ', uri);
    EventDispatcher.instance.emit('importFromUrl', uri.substring('noodl:import/'.length));
  }
});

ipcRenderer.on('import-projectmetadata', (event, data) => {
  ProjectModel.instance.mergeMetadata(data);
});

function setupViewerIpc() {
  ipcRenderer.on('viewer-refreshed', () => {
    EventDispatcher.instance.emit('viewer-refreshed');
  });

  ipcRenderer.on('viewer-closed', () => {
    EventDispatcher.instance.emit('viewer-closed');
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // Register node adapters
  require('./src/models/NodeTypeAdapters/registeradapters');

  // Disable context menu
  $('body').on('contextmenu', function () {
    return false;
  });

  ipcRenderer.on('showAutoUpdatePopup', () => {
    //@ts-expect-error
    window._hasNewAutoUpdateAvailable = true;
  });

  setupViewerIpc();

  ipcRenderer.on('window-focused', () => {
    EventDispatcher.instance.notifyListeners('window-focused');
  });

  document.addEventListener('mousedown', () => {
    remote.getCurrentWindow().focus();
  });

  // Activity detector
  let lastActiveTime = +new Date();
  document.addEventListener('mousedown', function (evt) {
    const now = +new Date();
    if (now > lastActiveTime + 10 * 60 * 1000) {
      // Wake up after 10 minutes of inactivity
      EventDispatcher.instance.notifyListeners('wakeup');
    }
    lastActiveTime = now;
  });

  EventDispatcher.instance.on('ProjectModel.instanceWillChange', () => {
    //@ts-expect-error
    window.NodeLibraryData = undefined;
    NodeLibrary.instance.reload();
  }, null);

  // Create the main element
  const rootElement = document.getElementById('root');
  ReactDOM.render(React.createElement(Router, { uri: remote.process.env.noodlURI }), rootElement);
});
