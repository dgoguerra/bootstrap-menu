var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './webpackEntry.js',
    resolve: {
        root: __dirname
    },
    // leave jquery as an external dependency for this distributable build
    externals: {
        jquery: 'jQuery'
    },
    plugins: []
};
