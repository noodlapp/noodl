const path = require('path');

// NOTE: packagesDir will be resolved to packages by the build system too
const editorDir = path.join(__dirname, '../../');
const packagesDir = path.join(__dirname, '../../../');

console.log('--- Webpack Configuration');
console.log('> Editor path: ', editorDir);
console.log('> Packages path: ', packagesDir);
console.log('---');

const alias = {
  '@scss-placeholders': path.join(editorDir, 'src/editor/src/styles/placeholders'),
  '@scss-mixins': path.join(editorDir, 'src/editor/src/styles/mixins'),
  '@scss-variables': path.join(editorDir, 'src/editor/src/styles/variables'),
  '@noodl-core-ui': path.join(packagesDir, 'noodl-core-ui/src'),
  '@noodl-hooks': path.join(editorDir, 'src/editor/src/hooks'),
  '@noodl-utils': path.join(editorDir, 'src/editor/src/utils'),
  '@noodl-models': path.join(editorDir, 'src/editor/src/models'),
  '@noodl-constants': path.join(editorDir, 'src/editor/src/constants'),
  '@noodl-contexts': path.join(editorDir, 'src/editor/src/contexts'),
  '@noodl-types': path.join(editorDir, 'src/editor/src/types'),
  '@noodl-views': path.join(editorDir, 'src/editor/src/views'),
  '@noodl-store': path.join(editorDir, 'src/editor/src/store')
};

console.log('> alias:');
console.log(JSON.stringify(alias, null, 2));
console.log('---');

module.exports = {
  output: {
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx', '.ttf'],
    alias
  }
};
