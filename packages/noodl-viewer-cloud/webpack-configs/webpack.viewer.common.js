//shared config for regular (non-deploy) viewer

const path = require('path');
const { merge } = require('webpack-merge');
const { outPath, runtimeVersion } = require('./constants.js');
const common = require('./webpack.common.js');
const webpack = require('webpack');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');

const noodlEditorExternalViewerPath = path.join(outPath, 'cloudruntime');

function stripStartDirectories(targetPath, numDirs) {
  const p = targetPath.split('/');
  p.splice(0, numDirs);
  return p.join(path.sep);
}

const prefix = `const { ipcRenderer } = require('electron'); const _noodl_cloud_runtime_version = "${runtimeVersion}";`;

module.exports = merge(common, {
  entry: {
    sandbox: './src/sandbox.viewer.js'
  },
  output: {
    filename: 'sandbox.viewer.bundle.js',
    path: noodlEditorExternalViewerPath
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: prefix,
      raw: true
    }),
    new CleanWebpackPlugin(noodlEditorExternalViewerPath, {
      allowExternal: true
    }),
    new CopyWebpackPlugin([
      {
        from: 'static/viewer/**/*',
        transformPath: (targetPath) => stripStartDirectories(targetPath, 2)
      }
    ]),
    new GenerateJsonPlugin('manifest.json', {
      version: runtimeVersion
    })
  ]
});
