const { merge } = require('webpack-merge');
const common = require('./webpack.viewer.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  watch: true
});
