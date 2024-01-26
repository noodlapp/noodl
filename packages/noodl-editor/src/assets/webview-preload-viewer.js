const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('NoodlEditor', {
  keyDown(event, cb) {
    makeEditorAPIRequest('keyDown', event, cb);
  },
  inspectNodes(nodeIds, cb) {
    makeEditorAPIRequest('inspectNodes', {nodeIds}, cb);
  }
});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

var _editorAPICallbacks = {};

function makeEditorAPIRequest(api, args, callback) {
  var t = guid();
  _editorAPICallbacks[t] = function (r) {
    callback && callback(r.response);
  };
  ipcRenderer.send('editor-api-request', { api: api, token: t, args: args });
}

ipcRenderer.on('editor-api-response', function (event, args) {
  var token = args.token;

  if (!_editorAPICallbacks[token]) return;
  _editorAPICallbacks[token](args);
  delete _editorAPICallbacks[token];
});

// Override getUserMedia to ask user for permission first, this is needed for
// MacOSX
var _getUserMedia = window.navigator.mediaDevices.getUserMedia;
window.navigator.mediaDevices.getUserMedia = function (constraints) {
  var types = [];
  if (constraints.video !== undefined && constraints.video !== false) {
    types.push('video');
  }

  if (constraints.audio !== undefined && constraints.audio !== false) {
    types.push('audio');
  }

  return new Promise(function (resolve, reject) {
    // Must request access to media
    ipcRenderer.on('request-media-access-reply', function (event, result) {
      if (result === true) {
        // Continue with getUserMedia request
        _getUserMedia.apply(window.navigator.mediaDevices, [constraints]).then(resolve).catch(reject);
      } else reject(new Error('Could not get access to media device'));
    });
    ipcRenderer.send('request-media-access', types);
  });
};
