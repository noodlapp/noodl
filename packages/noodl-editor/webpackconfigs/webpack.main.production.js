const path = require('path');
const merge = require('webpack-merge').default;
const shared = require('./shared/webpack.shared.js');
const getExternalModules = require('./helpers/get-externals-modules');

module.exports = merge(shared, {
  mode: 'production',
  target: 'electron-main',
  externals: getExternalModules({
    production: true
  }),
  entry: {
    './src/main/main': './src/main/main.js'
  },
  output: {
    path: path.join(__dirname, '.././'),
    filename: '[name].bundle.js',
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2'
  }
});
