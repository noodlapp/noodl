const viewer = require('./webpack.viewer.prod');
const deploy = require('./webpack.deploy.prod');
const ssr = require('./webpack.ssr.prod');

module.exports = [viewer, deploy, ssr];
