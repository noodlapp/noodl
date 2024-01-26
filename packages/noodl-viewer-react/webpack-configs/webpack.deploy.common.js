const path = require('path');
const { merge } = require('webpack-merge');
const { outPath } = require('./constants.js');
const common = require('./webpack.common.js');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const noodlEditorExternalDeployPath = path.join(outPath, 'deploy');

function stripStartDirectories(targetPath, numDirs) {
  const p = targetPath.split('/');
  p.splice(0, numDirs);
  return p.join(path.sep);
}

module.exports = merge(common, {
  entry: {
    deploy: './index.deploy.js'
  },
  output: {
    filename: 'noodl.[name].js',
    path: noodlEditorExternalDeployPath
  },
  plugins: [
    new CleanWebpackPlugin(noodlEditorExternalDeployPath, {
      allowExternal: true
    }),
    new CopyWebpackPlugin([
      {
        from: 'static/shared/**/*',
        transformPath: (targetPath) => stripStartDirectories(targetPath, 2)
      },
      {
        from: 'static/deploy/**/*',
        transformPath: (targetPath) => stripStartDirectories(targetPath, 2)
      }
    ])
  ]
});
