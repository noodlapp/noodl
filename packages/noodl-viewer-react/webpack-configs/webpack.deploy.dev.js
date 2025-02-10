const { merge } = require('webpack-merge');
const common = require('./webpack.deploy.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  watch: true
});
