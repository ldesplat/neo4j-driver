# Neo4j-js
Simple javascript Neo4j driver that supports only the recomended endpoints.

[![Build Status](https://travis-ci.org/ldesplat/neo4j-js.svg?branch=master)](https://travis-ci.org/ldesplat/neo4j-js)
[![Dependency Status](https://david-dm.org/ldesplat/neo4j-js.svg?style=flat)](https://david-dm.org/ldesplat/neo4j-js)

## Work in Progress

You are much better off using approved neo4j javascript drivers. This is currently a very bad driver with poor code. It is being built out of the needs of having a simpler driver that does not over manipulate the results. API experiements will be frequent so code will break and there is no documentation!

Be warned, there are many issues.

## API Usage

This module has not been published to npm but let's assume it is called `neo4j-js`

```javascript
var neo4j = require('neo4j-js');

// specify a custom url (it defaults to http://localhost:7474/db/data/)
var db = new neo({ url: 'http://localhost:7474/db/data/' }, function (error) {

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
    });
});

// DO NOT USE db here
// Internally we ask the API where the endpoints are, so we need to do an async call
```
