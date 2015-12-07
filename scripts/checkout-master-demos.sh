#!/usr/bin/env bash

git checkout origin/master -- docs/ dist/

git reset -q

rsync -r docs/ . && rm -rf docs

sed -i '' 's/\.\.\/dist/\.\/dist/g' demos.html
