const webpack = require('webpack'); //this must be included for webpack to work
const child_process = require('child_process');
const merge = require('webpack-merge').default;
const shared = require('./shared/webpack.renderer.shared.js');
const getExternalModules = require('./helpers/get-externals-modules');

module.exports = merge(shared, {
  mode: 'development',
  devtool: 'eval-source-map',
  externals: getExternalModules({
    production: false
  }),
  output: {
    publicPath: `http://localhost:8080/`
  },
  devServer: {
    client: {
      logging: 'info',
      // show error overlay in the electron windows
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: false
      }
    },
    hot: true,
    host: 'localhost', // Default: '0.0.0.0' that is causing issues on some OS / net interfaces
    port: 8080,
    onListening(devServer) {
      //start electron when the dev server has started
      child_process
        .spawn('npm', ['run', 'start:_dev'], {
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
