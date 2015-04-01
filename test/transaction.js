var Hoek = require('hoek');
var Lab = require('lab');
var Code = require('code');
var Transaction = require('../lib/transaction');


var expect = Code.expect;
var lab = exports.lab = Lab.script();


var internals = {
    options: {
        transaction: 'http://localhost:7474/db/data/transaction',
        timeout: 5000,
        authorization: 'Basic ' + new Buffer('neo4j' + ':' + 'neo4j').toString('base64')
    }
};


lab.experiment('Transaction -', function () {

    lab.test('No Authorization', function (done) {

        var config = Hoek.applyToDefaults(internals.options, {});
        config.authorization = undefined;

        var transact = new Transaction(config);

        var stmts1 = [
            {
                statement: 'MATCH (n:DOESNOTEXIST) RETURN n',
                parameters: {}
            }
        ];

        transact.commit(stmts1, function (err, results) {

            expect(err).to.be.an.array();
            expect(err[0]).to.be.an.object;
            expect(err[0].message).to.contain('authorization');
            expect(results).to.be.null();
            done();
        });
    });


    lab.test('Always Commit', function (done) {

        var transact = new Transaction(internals.options);

        var stmts1 = [
            {
                statement: 'MATCH (n:DOESNOTEXIST) RETURN n',
                parameters: {}
            }
        ];

        transact.commit(stmts1, {}, function (err, results) {

            expect(err).to.be.null();
            expect(results).to.be.an.array();
            expect(results[0].columns).to.be.an.array();
            expect(results[0].columns[0]).to.equal('n');
            done();
        });
    });


    lab.test('Force a syntax error', function (done) {

        var transact = new Transaction(internals.options);

        var stmts1 = [
            {
                statement: 'INVALID SYNTAX',
                parameters: {}
            }
        ];

        transact.commit(stmts1, function (err, results) {

            expect(err).to.be.an.array();
            expect(err[0].code).to.contain('InvalidSyntax');
            done();
        });
    });

});
