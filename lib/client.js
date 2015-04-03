'use strict';

var Hoek = require('hoek');
var Wreck = require('wreck');
var Transaction = require('./transaction');


Wreck.agents.https.keepAlive = true;
Wreck.agents.http.keepAlive = true;


var internals = {
    defaults: {
        url: 'http://localhost:7474/db/data/',
        timeout: 5000,
        credentials: null
    }
};


exports = module.exports = function (options, callback) {

    var db = new internals.Client(options, function (err) {
        callback(err, db);
    });
};


internals.Client = function (options, callback) {

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    this._config = Hoek.applyToDefaults(internals.defaults, options);

    if (this._config.url.lastIndexOf('/') !== this._config.url.length - 1) {
        this._config.url += '/';
    }

    this._headers = {
        'Accept': 'application/json; charset=UTF-8'
    };

    if (this._config.credentials) {
        this._headers.authorization = 'Basic ' + new Buffer(this._config.credentials.username + ':' + this._config.credentials.password).toString('base64');
    }

    var self = this;
    Wreck.get(this._config.url, { headers: this._headers, json: true }, function (err, response, payload) {

        if (err) {
            return callback(err);
        }

        if (response.statusCode === 401) {
            return callback(new Error('Unauthorized access. Ensure that you are providing credentials.'));
        }

        if (!payload || !payload.transaction) {
            return callback(new Error('Transaction endpoint was not found. Ensure that you are connecting to a neo4j 2.1.7+ instance.'));
        }

        self._config.transaction = payload.transaction;
        self._config.commit = payload.transaction + '/commit';
        callback();
    });
};


internals.Client.prototype.cypher = function (query, params, callback) {

    if (typeof params === 'function') {
        callback = params;
        params = undefined;
    }

    if (!params) {
        params = {};
    }

    var transact = this.transact();

    var statements = [
        {
            statement: query,
            parameters: params
        }
    ];

    transact.commit(statements, callback);
};


internals.Client.prototype.transact = function (options) {

    var config = {
        transaction: this._config.transaction,
        timeout: this._config.timeout,
        authorization: this._headers.authorization
    };

    return new Transaction(config);
};
