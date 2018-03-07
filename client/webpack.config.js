const HtmlPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './src/main.js',
  plugins: [new HtmlPlugin({template: './src/index.html'})],
  devtool: 'source-map',
  devServer: {
    port: 3000
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../public')
  }
};
