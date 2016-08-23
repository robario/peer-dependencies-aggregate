#! /usr/bin/env node
'use strict';
// node_modules
var minimist = require('minimist');
// local
var peerDependenciesResolve = require('..');

var argv = minimist(process.argv.slice(2), {
    string: ['root', '_'],
    boolean: 'verbose',
    alias: {v: 'verbose'},
});
if (argv._.length) {
    argv.root = argv._[0];
}

var result = peerDependenciesResolve(argv);
console.log(JSON.stringify(result, null, 2));
