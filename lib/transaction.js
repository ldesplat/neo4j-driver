'use strict';

var Async = require('async');
var Hoek = require('hoek');
var Wreck = require('wreck');


var internals = {
    defaults: {
        timeout: 5000,
    }
};


exports = module.exports = internal.Transaction = function (options) {

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

    this._transactQueue = Async.queue(function (task, callback) {

        internals._transact(task.statements, task.options, function (err, results) {

            callback();
        });
    }, 1);
};


internals.Transaction.commit = function (statements, options, callback) {

    options = options || { commit: true };

    if (!options.commit) {
        options.commit = true;
    }

    this.transact(statements, options, callback);
};


internals.Transaction.transact = function (statements, options, callback) {

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    this._transactQueue.push(
        {
            statements: statements,
            options: options,
            callback: callback
        },
        function (err, data) {

            console.log('callback transact', err, data);
            callback(err);
        }
    );
};


internals.Transaction._transact = function (statements, options, callback) {

    Wreck.post(
        options.commit ? this._commitEndpoint : this._transactEndpoint,
        Hoek.applyToDefaults(this._postOptions, { payload: JSON.stringify(statements) }),
        function (err, response, payload) {

            if (!options.commit) {
                this._transactEndpoint = response.headers['Location'];
                this._commitEndpoint = payload.commit;
            }

            callback(err, payload);
        }
    );
};
