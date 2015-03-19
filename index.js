'use strict';

var Hoek = require('hoek');
var Wreck = require('wreck');
var Transaction = require('./lib/transaction');


Wreck.agents.https.keepAlive = true;
Wreck.agents.http.keepAlive = true;


var internals = {
    defaults: {
        url: 'http://localhost:7474/db/data/',
        timeout: 5000
    }
};


exports = module.exports = internals.Cypher = function (options, callback) {

    this._config = Hoek.applyToDefaults(internals.defaults, options);

    if (this._config.url.lastIndexOf('/') !== this._config.url.length - 1) {
        this._config.url += '/';
    }

    var self = this;
    Wreck.get(this._config.url, { headers: { 'Accept': 'application/json; charset=UTF-8'}, json: true }, function (err, response, payload) {

        if (err) {
            return callback(err);
        }

        if (!payload || !payload.transaction) {
            return callback(new Error('transaction endpoint was not found. Ensure that you are connecting to a neo4j 2.1.7+ instance.'));
        }

        self._config.cypher = payload.transaction + '/commit';
        callback();
    });
};


internals.Cypher.prototype.cypher = function (query, params, callback) {

    if (typeof params === 'function') {
        callback = params;
        params = {};
    }

    Wreck.post(
        this._config.cypher,
        {
            json: true,
            payload: JSON.stringify({statements: [{statement: query, parameters: params}]})
        },
        function (err, response, payload) {

            (err || payload.errors.length > 0) ? callback(err || payload.errors, null) : callback(null, payload.results);
        }
    );
};

internals.Cypher.prototype.transact = function (options) {

    var config = {
        transaction = this._config.transaction,
        timeout = this._config.timeout
    };

    return new Transaction(config);
};

/*
internals.buildError = function (err) {

    var error = new Error(err.message);
    error.name = err.code;
    return error;
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
*/
