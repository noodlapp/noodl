const merge = require('webpack-merge').default;
const path = require('path');
const shared = require('./shared/webpack.renderer.shared.js');
const getExternalModules = require('./helpers/get-externals-modules');

module.exports = merge(shared, {
  mode: 'production',
  optimization: {
    minimize: false
  },
  devtool: 'source-map',
  externals: getExternalModules({
    production: true
  }),
  output: {
    path: path.join(__dirname, '.././')
  }
});
