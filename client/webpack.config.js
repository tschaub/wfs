const HtmlPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './main.js',
  plugins: [new HtmlPlugin({template: 'index.html'})],
  devtool: 'source-map',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../public')
  }
};
