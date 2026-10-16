var path = require('path');

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var webpackConfig = {
  // Use 'none' to avoid default minification interfering with debugging
  mode: 'production', 
  entry: {
    // This will be populated by the scaffold script
    // "my_viz": "./src/my_viz.js"
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    library: '[name]',
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    // Fix for react-grid-layout in Webpack 5
    // Disables strict ESM enforcement for .mjs files
    fallback: { buffer: false },
    fullySpecified: false 
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'to-string-loader' },
          { loader: 'css-loader' }
        ]
      }
    ]
  },
  plugins: [
    new UglifyJSPlugin({
      uglifyOptions: {
        compress: {
          warnings: false
        },
        output: {
          comments: false
        }
      }
    })
  ]
};

module.exports = webpackConfig;
