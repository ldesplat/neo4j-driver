'use strict';

var Wreck = require('wreck');

var internals = {
    addr: 'localhost:7474',
    endpoint: 'http://localhost:7474/db/data/transaction/commit'
};

internals.buildError = function (err) {

    var error = new Error(err.message);
    error.name = err.code;
    return error;
};

exports.install = function(addr) {
    internals.addr = addr || internals.addr;
    if (addr) {
        internals.endpoint = 'http://' + addr + '/db/data/transaction/commit';
    }
};

exports.cypher = function (query, params, cb) {

    Wreck.post(internals.endpoint,
        { json: true, payload: JSON.stringify({statements: [{statement: query, parameters: params}]}) },
        function (err, response, payload) {

            (err || payload.errors.length > 0) ? cb(err || payload.errors, null) : cb(null, payload.results);
        }
    );
};

exports.error = function (err, results, cb) {

    if (!err) {
        return cb(null, results);
    }

    if (Array.isArray(err)) {

        if (err.length === 0) {
            return cb(null, results);
        }

        if (err.length === 1) {
            return cb(internals.buildError(err[0]), results);
        }

        var error = new Error('Multiple neo4j errors detected');
        error.name = 'Neo.ClientError.Multiple';
        error.errors = [];

        err.forEach(function (oneError) {

            error.errors.push(internals.buildError(oneError));
        });

        return cb(error, results);
    }

    return cb(err, results);
};
