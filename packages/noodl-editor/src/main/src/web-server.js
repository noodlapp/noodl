const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const URL = require('url');

const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

const ProjectModules = require('../../shared/utils/projectmodules');
const JSONStorage = require('../../shared/utils/jsonstorage');

function parseRangeHeader(range, length) {
  if (!range || range.length === 0) {
    return null;
  }

  const parts = range.replace(/bytes=/, '').split('-');
  const partialstart = parts[0];
  const partialend = parts[1];

  const start = parseInt(partialstart, 10);
  const end = parseInt(partialend, 10);

  const result = {
    start: isNaN(start) ? 0 : start,
    end: isNaN(end) ? length - 1 : end
  };

  if (!isNaN(start) && isNaN(end)) {
    result.start = start;
    result.end = length - 1;
  }

  if (isNaN(start) && !isNaN(end)) {
    result.start = length - end;
    result.end = length - 1;
  }

  return result;
}

function startServer(app, projectGetSettings, projectGetInfo, projectGetComponentBundleExport) {
  const appPath = app.getAppPath();

  //accept any certificate from localhost (e.g. self signed)
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (url.startsWith('wss://localhost') || url.startsWith('https://localhost')) {
      event.preventDefault();
      callback(true);
    } else {
      console.log('reject certificate', url);
      callback(false);
    }
  });

  var port = process.env.NOODLPORT || 8574;

  function serveIndexFile(path, response) {
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        response.writeHead(404);
        response.end('internal error');
      }

      projectGetInfo((info) => {
        ProjectModules.instance.injectIntoHtml(info.projectDirectory, data, '/', function (injected) {
          projectGetSettings((settings) => {
            settings = settings || {};
            injected = injected.replace('{{#title#}}', settings.htmlTitle || 'Fluxscape Viewer');
            injected = injected.replace('{{#customHeadCode#}}', settings.headCode || '');

            response.writeHead(200, {
              'Content-Type': 'text/html'
            });
            response.end(injected);
          });
        });
      });
    });
  }

  function serveProjectBundle(path, response) {
    const idx = path.indexOf('/noodl_bundles/') + '/noodl_bundles/'.length;
    const name = decodeURI(path.substring(idx).replace('.json', ''));

    projectGetComponentBundleExport(name, (data) => {
      if (!data) {
        response.writeHead(404);
        response.end('component not found');
      } else {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(data);
      }
    });
  }

  function handleRequest(request, response) {
    var parsedUrl = URL.parse(request.url, true);

    let path = decodeURI(parsedUrl.pathname);

    //previous versions of Noodl will request /external/viewer/index.html or /external/viewer/index.htmlnull
    //new version can also do this if old requests are cached by electron
    if (path === '/external/viewer/index.html' || path.endsWith('viewer/index.htmlnull')) {
      serveIndexFile(appPath + '/src/external/viewer/index.html', response);
      return;
    }

    if (path.startsWith('/external/canvas/')) {
      if (path === '/external/canvas/index.html') {
        serveIndexFile(appPath + '/src' + path, response);
        //all done
        return;
      }
      //look in canvas folder for static files
      const fullPath = appPath + '/src' + path;
      if (fs.existsSync(fullPath)) {
        serveFile(fullPath, request, response);
        return;
      }

      //not done, strip away the index part of the path and continue
      path = path.replace('/external/canvas', '');
    } else if (path.startsWith('/external/viewer')) {
      //we're in the viewer folder, just strip away and proceed (treat it as the regular root path)
      path = path.replace('/external/viewer', '');
    }

    //special bundle folder that requests dynamic data from editor
    if (path.includes('/noodl_bundles/')) {
      serveProjectBundle(path, response);
      return;
    }

    //any folder, including root, serves the index (SPA app). Make any index.html just return the viewer
    //exclude noodl module folder (shouldn't be any folder requests, but who knows)
    if (path.includes('/noodl_modules/') === false && (path.endsWith('index.html') || path.includes('.') === false)) {
      serveIndexFile(appPath + '/src/external/viewer/index.html', response);
      return;
    }

    //by this point it must be a static file in either the viewer folder or the project
    //check if it's a viewer file
    const viewerFilePath = appPath + '/src/external/viewer/' + path;
    if (fs.existsSync(viewerFilePath)) {
      serveFile(viewerFilePath, request, response);
    } else {
      // Check if file exists in project directory
      projectGetInfo((info) => {
        const projectPath = info.projectDirectory + path;
        if (fs.existsSync(projectPath)) {
          serveFile(projectPath, request, response);
        } else {
          serve404(response);
        }
      });
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
    console.log('webserver hustling bytes on port', port);
    process.env.NOODLPORT = port;

    startWebSocketServer(server);
  });
}

function startWebSocketServer(server) {
  // Websocket server for sending updates and debugging
  var connectedSockets = [];
  var services = {};

  function broadcastMessage(msg, type) {
    var broadcastToType = type === 'viewer' ? 'editor' : 'viewer';
    for (var i = 0; i < connectedSockets.length; i++) {
      var s = connectedSockets[i];
      if (!type || s.type === broadcastToType) {
        s.ws.readyState === WebSocket.OPEN && s.ws.send(msg);
      }
    }
  }

  var wss = new WebSocketServer({
    server: server
  });

  wss.on('connection', function (ws) {
    var handle = {
      ws: ws
    };
    connectedSockets.push(handle);

    (function () {
      var _handle = handle;

      ws.on('message', function (message) {
        var request = JSON.parse(message);
        if (request.cmd === 'register') {
          _handle.type = request.type;
          _handle.clientId = request.clientId;

          // A viewer is connected, broadcast to editors
          if (request.type === 'viewer')
            broadcastMessage(
              JSON.stringify({
                cmd: 'registered',
                type: _handle.type,
                clientId: _handle.clientId
              }),
              _handle.type
            );

          if (_handle.type === 'service' && request.service)
            // A new serivce is registered
            services[request.service] = handle;
        }
        // If this is a request to a service, pass it along to the service
        else if (request.service) {
          var s = services[request.service];
          s && s.ws.send(message);
        } else {
          // If there is a target client, send the message to that client
          if (request.target) {
            for (var i = 0; i < connectedSockets.length; i++)
              if (connectedSockets[i].clientId === request.target) connectedSockets[i].ws.send(message);
          }
          // Broadcast message to other connected sockets
          // message from viewers should go to connected editors and vice versa
          else broadcastMessage(message, _handle.type);
        }
      });

      ws.on('error', (e) => {
        console.log('ws error', e);
      });

      ws.on('close', function () {
        const idx = connectedSockets.indexOf(_handle);
        const clientId = connectedSockets[idx].clientId;
        connectedSockets.splice(idx, 1);
        const msg = JSON.stringify({
          cmd: 'disconnect',
          clientId: clientId
        });
        broadcastMessage(msg, 'viewer'); // Notify editor that a viewer disconnected
      });
    })();
  });
}

function getContentType(request) {
  var extname = path.extname(request.url);
  var contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.webp':
      contentType = 'image/webp';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.wav':
      contentType = 'audio/wav';
    // eslint-disable-next-line no-fallthrough
    case '.mp4':
    case '.m4v':
      contentType = 'video/mp4';
      break;
    case '.wasm':
      contentType = 'application/wasm';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.ttf':
      contentType = 'font/ttf';
      break;
  }

  return contentType;
}

function serveFile(filePath, request, response) {
  fs.stat(decodeURI(filePath), (error, stat) => {
    if (error) {
      response.writeHead(404);
      response.end(error.message);
      return null;
    }

    const range = parseRangeHeader(request.headers.range, stat.size);
    if (range) {
      const start = range.start;
      const end = range.end;

      if (start >= stat.size || end >= stat.size) {
        response.writeHead(416, {
          'Content-Type': getContentType(request),
          'Content-Range': 'bytes */' + stat.size
        });

        return null;
      }

      const fileStream = fs.createReadStream(decodeURI(filePath), {
        start: range.start,
        end: range.end
      });

      fileStream.on('error', function (err) {
        response.writeHead(404);
        response.end(err.message);
      });

      const responseHeaders = {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + stat.size,
        'Content-Length': start == end ? 0 : end - start + 1,
        'Content-Type': getContentType(request),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache'
      };

      response.writeHead(206, responseHeaders);
      fileStream.pipe(response);
    } else {
      response.writeHead(200, {
        'Content-Type': getContentType(request),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET'
      });
      const fileStream = fs.createReadStream(decodeURI(filePath));
      fileStream.on('error', function (err) {
        response.writeHead(404);
        response.end(err.message);
      });

      fileStream.pipe(response);
    }
  });
}

function serve404(response) {
  response.writeHead(404);
  response.end('file not found');
}

module.exports = startServer;
