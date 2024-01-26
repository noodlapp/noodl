const merge = require('webpack-merge').default;
const shared = require('./webpack.shared.js');
const sharedCore = require('./webpack.renderer.core.js');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = merge(
  sharedCore,
  merge(shared, {
    entry: {
      './src/editor/index': './src/editor/index.ts',
      './src/frames/viewer-frame/index': './src/frames/viewer-frame/index.js',
    },
    output: {
      filename: '[name].bundle.js',
      // https://github.com/webpack/webpack/issues/1114
      libraryTarget: 'commonjs2'
    },
    plugins: [
      new MonacoWebpackPlugin({
        languages: ['typescript', 'javascript', 'css']
      })
    ]
  })
);
