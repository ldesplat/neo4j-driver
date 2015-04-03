'use strict';

var Hoek = require('hoek');
var Wreck = require('wreck');


var internals = {
    defaults: {
        timeout: 5000
    }
};


exports = module.exports = internals.Transaction = function (options) {

    var config = Hoek.applyToDefaults(internals.defaults, options);

    this._transactEndpoint = config.transaction;
    this._commitEndpoint = config.transaction + '/commit';

    this._postOptions = {
        json: 'force',
        payload: '',
        timeout: config.timeout,
        headers: {
            'Accept': 'application/json; charset=UTF-8',
            'Content-Type': 'application/json'
        }
    };

    if (config.authorization) {
        this._postOptions.headers.authorization = config.authorization;
    }
};


internals.Transaction.prototype.commit = function (statements, options, callback) {

    if (typeof options === 'function') {
        callback = options;
        options = undefined;
    }

    options = options || { commit: true };

    if (!options.commit) {
        options.commit = true;
    }

    this.transact(statements, options, callback);
};


internals.Transaction.prototype.transact = function (statements, options, callback) {

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    var self = this;
    Wreck.post(
        options.commit ? this._commitEndpoint : this._transactEndpoint,
        Hoek.applyToDefaults(this._postOptions, { payload: JSON.stringify({ statements: statements }) }),
        function (err, response, payload) {

            if (err) {
                return callback(err, null);
            }

            if (!options.commit) {
                if (response.headers.location) {
                    self._transactEndpoint = response.headers.location;
                }

                self._commitEndpoint = payload.commit;
            }

            (payload.errors.length > 0) ? callback(payload.errors, null) : callback(null, payload.results);
        }
    );
};


internals.Transaction.prototype.rollback = function (callback) {

    Wreck.delete(
        this._transactEndpoint,
        this._postOptions,
        function (err, response, payload) {

            if (err) {
                return callback(err);
            }

            if (!payload) {
                return callback(new Error('You must have an active transaction before doing a rollback.'), null);
            }

            (payload.errors.length > 0) ? callback(payload.errors, null) : callback(null, payload.results);
        }
    );
};


internals.Transaction.prototype.extend = function (callback) {

    this.transact([], callback);
};
