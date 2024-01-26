const path = require('path');
const { runtimeVersion } = require('./constants.js');
const webpack = require('webpack');

const prefix = `const _noodl_cloud_runtime_version = "${runtimeVersion}";`;

module.exports = {
  //mode: 'production',
  mode: 'development',
  watch: true,
  entry: './src/sandbox.isolate.js',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    path: path.resolve(__dirname, '../dist')
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: prefix,
      raw: true
    })
  ]
};
