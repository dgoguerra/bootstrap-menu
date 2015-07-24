var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './webpackEntry.js',
    resolve: {
        root: __dirname,
        alias: {
            /* for our distributable BootstrapMenu build, use a custom lodash version which
             * only includes the subset in use of the package, to obtain a smaller build size. */
            lodash: path.resolve(__dirname, 'src/lodash-custom.js'),
            // alias to the original lodash module, to be used inside lodash-custom
            _lodash: path.resolve(__dirname, 'node_modules/lodash')
        }
    },
    // leave jquery as an external dependency for this distributable build
    externals: {
        jquery: 'jQuery'
    },
    plugins: []
};
