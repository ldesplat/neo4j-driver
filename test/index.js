var Lab = require('lab');
var Code = require('code');
var Http = require('http');

var neo = require('../index');

var url = 'http://localhost:7474/db/data/';

var expect = Code.expect;
var lab = exports.lab = Lab.script();


lab.experiment('Cypher', function () {

    lab.test('Wrong URL', function (done) {

        var db = new neo({ url: 'http://nonsense.nonsense' }, function (err) {

            expect(err).to.be.an.instanceof(Error);
            expect(err.message).to.contain('Client request error');
            done();
        });

    });

    lab.test('Run a simple query', function (done) {

        var db = new neo({ url: url }, function(error) {
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

    lab.test('Force a syntax error', function (done) {

        var db = new neo({ url: url }, function(error) {
            expect(error).to.not.exist();

            db.cypher('INVALID SYNTAX', {}, function (err, results) {

                expect(err).to.be.an.array();
                expect(err[0].code).to.contain('InvalidSyntax');
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

            var db = new neo({ url: 'http://localhost:' + server.address().port }, function(error) {
                expect(error).to.not.exist();

                db.cypher('INVALID SYNTAX', {}, function (err, results) {

                    expect(err).to.be.an.instanceof(Error);
                    expect(err.message).to.contain('Client request error');
                    done();
                });
            });
        });
    });
});
