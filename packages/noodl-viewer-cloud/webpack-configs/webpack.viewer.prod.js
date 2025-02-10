const { merge } = require('webpack-merge');
const common = require('./webpack.viewer.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map'
});
