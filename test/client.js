var Fs = require('fs');
var Http = require('http');
var Hoek = require('hoek');
var Lab = require('lab');
var Code = require('code');

var Neo4j = require('../');


var expect = Code.expect;
var lab = exports.lab = Lab.script();


var internals = {
    options: {
        url: 'http://localhost:7474/db/data/',
        credentials: {
            username: 'neo4j',
            password: 'neo4j'
        }
    }
};


lab.experiment('Cypher -', function () {

    lab.test('Wrong URL', function (done) {

        Neo4j.Client({ url: 'http://nonsense.nonsense' }, function (err) {

            expect(err).to.be.an.instanceof(Error);
            expect(err.message).to.contain('Client request error');
            done();
        });
    });


    lab.test('No payload', function (done) {

        var config = Hoek.applyToDefaults(internals.options, {
            url: internals.options.url.substring(0, internals.options.url.length - 2)
        });

        Neo4j.Client(config, function (err) {

            expect(err).to.be.an.instanceof(Error);
            expect(err.message).to.contain('Transaction endpoint was not found');
            done();
        });
    });


    lab.test('Bad authentication', function (done) {

        var config = Hoek.applyToDefaults(internals.options, { credentials: { username: 'invalid', password: 'invalid' } });

        Neo4j.Client(config, function (err) {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.contain('Unauthorized');
            done();
        });
    });


    lab.test('Run a simple query', function (done) {

        Neo4j.Client(internals.options, function(error, db) {
            expect(error).to.not.exist();

            db.cypher('MATCH (n:DOESNOTEXIST) RETURN n', function (err, results) {

                expect(err).to.be.null();
                expect(results).to.be.an.array();
                expect(results[0].columns).to.be.an.array();
                expect(results[0].columns[0]).to.equal('n');
                done();
            });
        });
    });


    lab.test('Force a network error', function (done) {

        var requestNum = 0;
        var server = Http.createServer(function (req, res) {

            if (requestNum === 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(
                    {
                        transaction: 'http://DOESNOTEXIST.DOESNOTEXIST'
                    }
                ));
                return;
            }
            res.end();
        });

        server.listen(0, function () {

            Neo4j.Client({ url: 'http://localhost:' + server.address().port }, function(error, db) {
                expect(error).to.not.exist();

                db.cypher('INVALID SYNTAX', {}, function (err, results) {

                    expect(err).to.be.an.instanceof(Error);
                    expect(err.message).to.contain('Client request error');
                    done();
                });
            });
        });
    });


    lab.test('get a transact object', function (done) {

        Neo4j.Client(internals.options, function (error, db) {

            var transaction = db.transact();

            var stmts1 = [
                {
                    statement: 'MATCH (n:DOESNOTEXIST) RETURN n',
                    parameters: {}
                }
            ];
            transaction.transact(stmts1, function (err, res) {

                expect(err).to.be.null();
                expect(res).to.be.an.array();
                expect(res[0].columns).to.be.an.array();
                expect(res[0].columns[0]).to.equal('n');

                transaction.commit(stmts1, { commit: true }, function (error, results) {

                    expect(error).to.be.null();
                    expect(results).to.be.an.array();
                    expect(results[0].columns).to.be.an.array();
                    expect(results[0].columns[0]).to.equal('n');
                    done();
                });
            });
        });
    });
});
