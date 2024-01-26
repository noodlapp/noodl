//shared config for regular (non-deploy) viewer

const path = require('path');
const { merge } = require('webpack-merge');
const { outPath } = require('./constants.js');
const common = require('./webpack.common.js');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const noodlEditorExternalViewerPath = path.join(outPath, 'viewer');

function stripStartDirectories(targetPath, numDirs) {
  const p = targetPath.split('/');
  p.splice(0, numDirs);
  return p.join(path.sep);
}

module.exports = merge(common, {
  entry: {
    viewer: './index.viewer.js'
  },
  output: {
    filename: 'noodl.[name].js',
    path: noodlEditorExternalViewerPath
  },
  plugins: [
    new CleanWebpackPlugin(noodlEditorExternalViewerPath, {
      allowExternal: true
    }),
    new CopyWebpackPlugin([
      {
        from: 'static/shared/**/*',
        transformPath: (targetPath) => stripStartDirectories(targetPath, 2)
      },
      {
        from: 'static/viewer/**/*',
        transformPath: (targetPath) => stripStartDirectories(targetPath, 2)
      }
    ])
  ]
});
