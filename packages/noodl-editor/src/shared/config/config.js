const configDev = require('./config-dev');
const configDist = require('./config-dist');

function getProcess() {
  try {
    const remote = require('@electron/remote');
    return remote ? remote.process : process;
  } catch (exc) {
    // Error: "@electron/remote" cannot be required in the browser process. Instead require("@electron/remote/main").
    return process;
  }
}

const _process = getProcess();

if (!_process.env.devMode) _process.env.devMode = (_process.argv || []).indexOf('--dev') !== -1 ? 'yes' : 'no';
module.exports = _process.env.devMode === 'yes' ? configDev : configDist;
