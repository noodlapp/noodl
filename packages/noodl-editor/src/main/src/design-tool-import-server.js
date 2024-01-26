const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const JSONStorage = require('../../shared/utils/jsonstorage');
const { app } = require('electron');
const fs = require('fs');

let win;
let clientSockets = [];

let projectName = null;

function sendProjectName(ws, name) {
  ws.send(
    JSON.stringify({
      type: 'projectInfo',
      data: {
        name: projectName
      }
    })
  );
}

function start(projectGetInfo) {
  const port = Number(process.env.NOODLPORT || 8574) + 1; //use standard Noodl port + 1

  var wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    clientSockets.push(ws);

    ws.on('close', () => {
      const idx = clientSockets.findIndex((w) => w === ws);
      if (idx !== -1) clientSockets.splice(idx, 1);
    });

    ws.send(
      JSON.stringify({
        type: 'editorInfo',
        data: {
          version: app.getVersion()
        }
      })
    );

    sendProjectName(ws, projectName);

    let imageName;
    ws.on('message', (data, isBinary) => {
      const message = isBinary ? data : data.toString();

      if (message instanceof Uint8Array) {
        //got image
        const name = imageName; //async hax trickery
        projectGetInfo((local) => {
          const path = local.projectDirectory + '/' + name;
          fs.writeFileSync(path, message);
        });
      } else {
        const request = JSON.parse(message);

        if (request.type === 'export') {
          win.send('import-nodeset', request.data.nodeset);
          win.show(); //focus window
        } else if (request.type === 'exportImageName') {
          imageName = request.name;
        } else if (request.type === 'exportProjectMetadata') {
          win.send('import-projectmetadata', request.data.metadata);
        }
      }
    });
  });
}

function setWindow(window) {
  win = window;
}

function setProjectName(name) {
  projectName = name;
  clientSockets.forEach((ws) => sendProjectName(ws, name));
}

module.exports = {
  start,
  setWindow,
  setProjectName
};
