const electron = require('electron');
const { BrowserWindow, ipcMain } = electron;
const http = require('http');
const https = require('https');
const URL = require('url');

var port = process.env.NOODL_CLOUD_FUNCTIONS_PORT || 8577;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

let sandbox;
let hasLoadedProject = false;
const queuedRequestsBeforeProjectLoaded = [];

function openCloudRuntimeDevTools() {
  if (sandbox) {
    if (sandbox.isDevToolsOpened()) {
      //closing and opening the dev tools will put it on front of the editor window
      sandbox.closeDevTools();
    }

    sandbox.openDevTools({
      mode: 'detach'
    });
  } else {
    console.log('No cloud sandbox active');
  }
}

function closeCloudRuntime() {
  if (sandbox) {
    sandbox.destroy();
    sandbox = undefined;
  }
}

function refresh() {
  if (sandbox) {
    sandbox.reload();
  }
}

function startCloudFunctionServer(app, cloudServicesGetActive, mainWindow) {
  function startCloudRuntime() {
    const appPath = app.getAppPath();

    sandbox = new BrowserWindow({
      width: 10,
      height: 10,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webviewTag: false
      },
      show: false
    });

    console.log('starting cloud runtime');

    hasLoadedProject = false;

    sandbox.loadURL('file:///' + appPath + '/src/external/cloudruntime/index.html');
    sandbox.webContents.on('did-start-loading', () => {
      //window has been refreshed, we need to wait for the viewer to get the export and load the components before handling the requests
      hasLoadedProject = false;
    });
  }

  const _responseHandlers = {};
  ipcMain.on('noodl-cf-response', function (event, args) {
    const token = args.token;

    if (!_responseHandlers[token]) return;
    _responseHandlers[token](args);
    delete _responseHandlers[token];
  });

  ipcMain.on('noodl-cf-has-loaded-project', function (event, args) {
    hasLoadedProject = true;

    for (const req of queuedRequestsBeforeProjectLoaded) {
      sandbox.webContents.send('noodl-cf-request', req);
    }
    queuedRequestsBeforeProjectLoaded.length = 0;
  });

  ipcMain.on('noodl-cf-fetch', function (event, args) {
    const token = args.token;
    const url = URL.parse(args.url, true);

    const _options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: args.method || 'GET',
      headers: args.headers
    };

    console.log('noodl-cf-fetch');
    console.log(_options);
    console.log(args.body);

    const httpx = url.protocol === 'https:' ? https : http;
    const req = httpx.request(_options, (res) => {
      let _data = '';
      res.on('data', (d) => {
        _data += d;
      });
      res.on('end', () => {
        const _response = {
          token,
          headers: res.headers,
          body: _data,
          status: res.statusCode
        };
        console.log('response', _response);
        sandbox.webContents.send('noodl-cf-fetch-response', _response);
      });
    });

    req.on('error', (error) => {
      console.log('error', error);
      sandbox.webContents.send('noodl-cf-fetch-response', {
        token,
        error: error
      });
    });

    req.write(args.body);
    req.end();
  });

  ipcMain.on('project-opened', startCloudRuntime);
  ipcMain.on('cloud-runtime-open-devtools', openCloudRuntimeDevTools);
  ipcMain.on('project-closed', closeCloudRuntime);
  ipcMain.on('cloud-runtime-refresh', refresh);

  function handleRequest(request, response) {
    const headers = {
      'Access-Control-Allow-Origin': '*' /* @dev First, read about security */,
      'Access-Control-Allow-Methods': 'OPTIONS, POST',
      'Access-Control-Max-Age': 2592000, // 30 days
      'Access-Control-Allow-Headers': '*'
    };

    if (request.method === 'OPTIONS') {
      response.writeHead(204, headers);
      response.end();
    } else if (request.method === 'POST') {
      var parsedUrl = URL.parse(request.url, true);

      let path = decodeURI(parsedUrl.pathname);

      if (path.startsWith('/functions/')) {
        const functionName = decodeURIComponent(path.split('/')[2]);

        console.log('Calling cloud function: ' + functionName);
        if (!sandbox) {
          console.log('Error: No cloud runtime active...');
          return;
        }

        var body = '';

        request.on('data', function (data) {
          body += data;
        });

        request.on('end', function () {
          headers['Content-Type'] = 'application/json';

          cloudServicesGetActive((cs) => {
            if (!cs) {
              response.writeHead(400, headers);
              response.end(JSON.stringify({ error: 'No active editor cloud services.' }));
              return;
            }

            try {
              console.log('with body ', body);

              const token = guid();
              _responseHandlers[token] = (args) => {
                response.writeHead(args.statusCode, args.headers || headers);
                response.end(args.body);
              };

              const cfRequestArgs = {
                function: functionName,
                token,
                headers: request.headers,
                body,
                cloudService: cs
              };
              if (hasLoadedProject) {
                sandbox.webContents.send('noodl-cf-request', cfRequestArgs);
              } else {
                queuedRequestsBeforeProjectLoaded.push(cfRequestArgs);
              }
            } catch (e) {
              console.log(e);

              response.writeHead(400, headers);
              response.end(JSON.stringify({ error: 'Failed to run function.' }));
            }
          });
        });
      }
    }
  }

  var server;
  if (process.env.ssl) {
    console.log('Using SSL');

    const options = {
      key: fs.readFileSync(process.env.sslKey),
      cert: fs.readFileSync(process.env.sslCert)
    };
    server = https.createServer(options, handleRequest).listen(port);
  } else {
    server = http.createServer(handleRequest).listen(port);
  }

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
    }

    const { dialog } = require('electron');
    dialog
      .showMessageBox({
        type: 'error',
        message: `A problem was encountered while starting Noodl's webserver\n\n${e.message}`
      })
      .then(() => {
        app.quit();
      });
  });

  server.on('listening', (e) => {
    console.log('noodl cloud functions server running on port', port);
    process.env.NOODL_CLOUD_FUNCTIONS_PORT = port;
  });
}

function closeRuntimeWhenWindowCloses(window) {
  window.on('closed', closeCloudRuntime);
}

module.exports = { startCloudFunctionServer, openCloudRuntimeDevTools, closeRuntimeWhenWindowCloses };
