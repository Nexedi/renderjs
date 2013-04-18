#! /bin/bash
node ./node_modules/requirejs/bin/r.js -o name=safe out=build/safe.js baseUrl=./
node ./node_modules/requirejs/bin/r.js -o name=jsdom out=jsdom_min.js baseUrl=lib/jsdom/lib
