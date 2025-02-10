const path = require('path');
const { outPath } = require('./constants.js');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const noodlEditorExternalDeployPath = path.join(outPath, 'ssr');

function stripStartDirectories(targetPath, numDirs) {
  const p = targetPath.split('/');
  p.splice(0, numDirs);
  return p.join(path.sep);
}

module.exports = {
  entry: {
    deploy: './index.ssr.js'
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
      // {
      //   from: 'static/shared/**/*',
      //   transformPath: (targetPath) => stripStartDirectories(targetPath, 2)
      // },
      {
        from: 'static/ssr/**/*',
        transformPath: (targetPath) => stripStartDirectories(targetPath, 2)
      }
    ])
  ],
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    fallback: {
      events: require.resolve('events/')
    }
  },
  module: {
    rules: [
      {
        test: /\.(jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            cacheDirectory: true,
            presets: ['@babel/preset-react']
          }
        }
      },
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false,
              modules: {
                exportOnlyLocals: true
              }
            }
          }
        ]
      }
    ]
  }
};
