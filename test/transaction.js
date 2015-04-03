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
    },
    stmts1: [
        {
            statement: 'MATCH (n:DOESNOTEXIST) RETURN n',
            parameters: {}
        }
    ]
};


lab.experiment('Transaction -', function () {

    lab.test('No Authorization', function (done) {

        var config = Hoek.applyToDefaults(internals.options, {});
        config.authorization = undefined;

        var transact = new Transaction(config);

        transact.commit(internals.stmts1, function (err, results) {

            expect(err).to.be.an.array();
            expect(err[0]).to.be.an.object;
            expect(err[0].message).to.contain('authorization');
            expect(results).to.be.null();
            done();
        });
    });


    lab.test('Always Commit', function (done) {

        var transact = new Transaction(internals.options);

        transact.commit(internals.stmts1, {}, function (err, results) {

            expect(err).to.be.null();
            expect(results).to.be.an.array();
            expect(results[0].columns).to.be.an.array();
            expect(results[0].columns[0]).to.equal('n');
            done();
        });
    });


    lab.test('Force a syntax error', function (done) {

        var transact = new Transaction(internals.options);

        var badStmts = [
            {
                statement: 'INVALID SYNTAX',
                parameters: {}
            }
        ];

        transact.commit(badStmts, function (err, results) {

            expect(err).to.be.an.array();
            expect(err[0].code).to.contain('InvalidSyntax');
            done();
        });
    });


    lab.test('Force a network error during transact', function (done) {

        var transact = new Transaction(internals.options);

        transact._transactEndpoint = 'http://DOESNOTEXIST.DOESNOTEXIST';
        transact.transact(internals.stmts1, {}, function (err, res) {

            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.contain('Client request error');
            expect(res).to.be.null();
            done();
        });
    });


    lab.test('Extend & rollback transaction', function (done) {

        var transact = new Transaction(internals.options);

        transact.transact(internals.stmts1, {}, function (err, results) {

            expect(err).to.be.null();
            expect(results).to.be.an.array();
            expect(results[0].columns).to.be.an.array();
            expect(results[0].columns[0]).to.equal('n');

            transact.extend(function (errors, res) {

                expect(errors).to.be.null();
                expect(res).to.be.an.array();
                expect(res.length).to.equal(0);

                transact.rollback(function (rErr, rRes) {

                    expect(rErr).to.be.null();
                    expect(rRes).to.be.an.array();
                    expect(rRes.length).to.equal(0);

                    done();
                });
            });
        });
    });


    lab.test('Force an error during rollback of empty transaction', function (done) {

        var transact = new Transaction(internals.options);

        transact.rollback(function (err, res) {

            expect(err).to.be.an.object();
            expect(err.message).to.contain('rollback');
            done();
        });
    });


    lab.test('Run transaction after doing a rollback', function (done) {

        var transact = new Transaction(internals.options);

        transact.transact(internals.stmts1, {}, function () {

            // assume it worked, since this is heavily tested
            transact.rollback(function (rErr, rRes) {

                expect(rErr).to.be.null();
                expect(rRes).to.be.an.array();
                expect(rRes.length).to.equal(0);

                transact.transact(internals.stmts1, function (err, res) {

                    expect(err).to.be.an.array();
                    expect(err[0].code).to.equal('Neo.ClientError.Transaction.UnknownId');
                    done();
                });
            });
        });
    });


    lab.test('Do a rollback twice in a row', function (done) {

        var transact = new Transaction(internals.options);

        transact.transact(internals.stmts1, {}, function () {

            // assume it worked, since this is heavily tested
            transact.rollback(function (rErr, rRes) {

                expect(rErr).to.be.null();
                expect(rRes).to.be.an.array();
                expect(rRes.length).to.equal(0);

                transact.rollback(function (err, res) {

                    expect(err).to.be.an.array();
                    expect(err[0].code).to.equal('Neo.ClientError.Transaction.UnknownId');
                    done();
                });
            });
        });
    });


    lab.test('Force a network error during rollback', function (done) {

        var transact = new Transaction(internals.options);

        transact.transact(internals.stmts1, {}, function () {

            // assume it worked, since this is heavily tested
            transact._transactEndpoint = 'http://DOESNOTEXIST.DOESNOTEXIST';
            transact.rollback(function (err, res) {

                expect(err).to.be.an.instanceOf(Error);
                expect(err.message).to.contain('Client request error');
                done();
            });
        });
    });
});
