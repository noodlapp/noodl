const merge = require('webpack-merge').default;
const path = require('path');
const child_process = require('child_process');
const shared = require('./shared/webpack.renderer.shared.js');
const getExternalModules = require('./helpers/get-externals-modules');

module.exports = merge(shared, {
  entry: './tests/index.ts',
  output: {
    filename: 'index.bundle.js',
    path: path.resolve(__dirname, '..', 'tests'),
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2',
    publicPath: `http://localhost:8081/`
  },
  target: 'electron-renderer',
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  externals: getExternalModules({
    production: false
  }),
  devServer: {
    host: 'localhost', // Default: '0.0.0.0' that is causing issues on some OS / net interfaces
    port: 8081,
    onListening(devServer) {
      //start electron when the dev server has started
      console.log('webpack dev server listening, starting electron with tests');
      child_process
        .spawn('npm', ['run', 'test:_start_electron'], {
          shell: true,
          env: process.env,
          stdio: 'inherit'
        })
        .on('close', (code) => {
          devServer.stop();
        })
        .on('error', (spawnError) => {
          console.error(spawnError);
          devServer.stop();
        });
    }
  }
});
