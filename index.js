'use strict';
// core
var fs = require('fs');
var path = require('path');
// node_modules
var semverResolve = require('semver-resolve');

var debug = function () {
    // do nothing.
};
if (/\bpeer-dependencies-resolve\b/i.test(process.env.NODE_DEBUG)) {
    debug = function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('PEER-DEPENDENCIES-RESOLVE');
        console.log.apply(console, args);
    };
}

module.exports = function (options) {
    var opts = Object.assign({
        root: process.cwd(),
        verbose: false,
    }, options);

    var requestersMap = {};
    var peerDependenciesMap = {};
    var packageRoot = path.resolve(opts.root, 'node_modules');
    fs.readdirSync(packageRoot)
        .forEach(function (packageDir) {
            try {
                var packageConfig = JSON.parse(fs.readFileSync(path.join(packageRoot, packageDir, 'package.json'), 'utf8'));
                if (packageConfig.peerDependencies) {
                    requestersMap[packageConfig.name] = packageConfig.peerDependencies;
                    Object.keys(packageConfig.peerDependencies).forEach(function (peerPackage) {
                        peerDependenciesMap[peerPackage] = peerDependenciesMap[peerPackage] || [];
                        peerDependenciesMap[peerPackage].push(packageConfig.peerDependencies[peerPackage]);
                    });
                }
            } catch (e) {
                // not a package
            }
        });

    debug('requestersMap', JSON.stringify(requestersMap));

    var result = {};
    Object.keys(peerDependenciesMap).sort().forEach(function (module) {
        var requesters = {};
        Object.keys(requestersMap).forEach(function (requester) {
            if ({}.hasOwnProperty.call(requestersMap[requester], module)) {
                requesters[requester] = requesters[requester] || {};
                requesters[requester][module] = requestersMap[requester][module];
            }
        });
        var callback = function (reason) {
            console.warn('WARN',
                         reason.type + ' test failure "' + module + '"',
                         'semver.satisfies("' + reason.version + '", "' + reason.range + '")',
                         'required by ' + JSON.stringify(requesters, null, 2));
        };
        var wanted = semverResolve(peerDependenciesMap[module], opts.verbose ? callback : null);
        if (wanted === '') {
            console.error('ERROR',
                          'Could not resolve "' + module + '"',
                          'required by ' + JSON.stringify(requesters, null, 2));
        }
        result[module] = wanted;
    });
    return result;
};
