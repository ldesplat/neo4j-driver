# Neo4j-js [![Build Status](https://travis-ci.org/ldesplat/neo4j-js.svg?branch=master)](https://travis-ci.org/ldesplat/neo4j-js) [![Coverage Status](https://coveralls.io/repos/ldesplat/neo4j-js/badge.svg?branch=master)](https://coveralls.io/r/ldesplat/neo4j-js?branch=master) [![Dependency Status](https://david-dm.org/ldesplat/neo4j-js.svg?style=flat)](https://david-dm.org/ldesplat/neo4j-js)
Simple javascript Neo4j driver that supports only the recomended endpoints.

## Work in Progress

You are much better off using approved neo4j javascript drivers. This is currently a very bad driver with poor code. It is being built out of the needs of having a simpler driver that does not over manipulate the results. API experiements will be frequent so code will break and there is no documentation!

Be warned, there are many issues.

## Roadmap

- Provide streaming support to transaction endpoint responses
- Allow to change resultDataContents -> Should be part of options object
- Provide logging hooks
- Provide events such as (Transaction about to expire soon, Transaction expired, Log Happened)
- Expose Expiry time in transact object

## API Usage

This module has not been published to npm but let's assume it is called `neo4j-js`

```javascript
var neo4j = require('neo4j-js');

// specify a custom url (it defaults to http://localhost:7474/db/data/)
var db = new neo({ url: 'http://localhost:7474/db/data/', credentials: { username: 'neo4j', password: 'neo4j' } }, function (error) {

    // verify error here to ensure we are connected
    if (err) {
        console.log(err);
        process.exit(1);
        // or do any retry logic
    }

    // you can now use db
    db.cypher('MATCH (n:Person) RETURN n', function (err, results) {

        // verify the err object again
        // if it is an instanceof Error then it's most likely a network error
        // otherwize it is the normal error (an array) returned from Neo4j's transaction endpoint

        // results is the same object that Neo4j returns from the transaction/commit endpoint

        var stmts = [
            {
                statement: 'MATCH (n:Person) RETURN n',
                parameters: {}
            }
        ];

        var transact = db.transact();

        transact.transact(stmts, {/*options*/}, function (errors, results) {

            transact.commit(smts, {/*options*/}, function (err, res) {


            });
        });
    });
});

// DO NOT USE db here
// Internally we ask the API where the endpoints are, so we need to do an async call
```
