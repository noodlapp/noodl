const viewer = require('./webpack.viewer.dev');
const deploy = require('./webpack.deploy.dev');
const ssr = require('./webpack.ssr.dev');

module.exports = [viewer, deploy, ssr];
