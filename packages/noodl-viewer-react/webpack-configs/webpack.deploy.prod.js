const { merge } = require('webpack-merge');
const common = require('./webpack.deploy.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map'
});
