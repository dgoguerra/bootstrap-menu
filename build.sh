#!/usr/bin/env bash

# Script to build the BootstrapMenu library to be used directly in
# a browser. Outputs the generated distributables in the dist/ folder.

# Unminified build
node_modules/.bin/webpack --config webpack.config.js \
    --output-filename dist/BootstrapMenu.js

# Minified build
node_modules/.bin/webpack --config webpack.min.config.js \
    --output-filename dist/BootstrapMenu.min.js
