module.exports = {
  target: 'electron-renderer',
  module: {
    rules: [
      //run babel on .jsx to transform the jsx
      //not doing it on all .js files speeds up the bundling by a lot
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
        // Setup to match what we have in Storybook
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              prettier: false,
              svgo: false,
              svgoConfig: {
                plugins: [
                  {
                    removeViewBox: false
                  }
                ]
              },
              titleProp: true,
              ref: true
            }
          },
          {
            loader: 'file-loader'
          }
        ]
      },
      //requiring html-files will return a string of the html
      {
        test: /\.(html)$/,
        exclude: /node_modules/,
        use: {
          loader: 'html-loader',
          options: {
            sources: false,
            esModule: false
          }
        }
      },
      {
        test: /(\.module)?.(sass|scss)$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false,
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:5]'
              },
              sourceMap: true
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false
            }
          }
        ]
      },
      {
        test: /\.(txt)$/,
        exclude: /node_modules/,
        use: {
          loader: 'raw-loader',
          options: {
            esModule: false
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx', '.ttf']
  }
};
