const path = require('path');

module.exports = {
  // Allows to define the output path of the files built by the viewer.
  //
  // For example in the CLI, we will also build this, just with a different output path.
  outPath: process.env.OUT_PATH || path.resolve(__dirname, '../../noodl-editor/src/external'),
  runtimeVersion: 'cloud-runtime-' + require('../package.json').version.replaceAll('.', '-')
};
