var webpack = require('webpack');
var config = require('./webpack.config.js');

//config.devtool = 'source-map';

config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({ minimize: true })
);

module.exports = config;
