#!/usr/bin/env bash

git checkout origin/master -- docs

git reset

mv docs/* .
