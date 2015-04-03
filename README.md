# Neo4j-driver [![Build Status](https://travis-ci.org/ldesplat/neo4j-driver.svg?branch=master)](https://travis-ci.org/ldesplat/neo4j-driver) [![Coverage Status](https://coveralls.io/repos/ldesplat/neo4j-driver/badge.svg?branch=master)](https://coveralls.io/r/ldesplat/neo4j-driver?branch=master) [![Dependency Status](https://david-dm.org/ldesplat/neo4j-driver.svg?style=flat)](https://david-dm.org/ldesplat/neo4j-driver)
This driver supports Cypher and Transactions as first class citizens. It is meant to be used for heavy writes and heavy queries. For that reason, it tries to do the least possible while still trying to provide optional utilities to make our jobs as developers easier.

## Contributions
If you have <b>any questions</b> or issues, please raise them in the issue tracker on github.

Contributions are very welcome. They must come with 100% test coverage and documentation, if appropriate, before being merged. They can be submitted beforehand if you need any help.

## Roadmap

- Utilities to deal with results array, errors, ...
- SSL Support
- Investigate potential issues if Neo4j is behind a reverse proxy (ie. changing hostname/ports during discovery)
- Provide streaming support to transaction endpoint responses
- Allow to change resultDataContents -> Should be part of options object
- Provide logging hooks
- Provide events such as (Transaction about to expire soon, Transaction expired, Log Happened)
- Expose Expiry time in transact object
- Investigate running in browser

## API

For more examples, you can check out the test folder.

> Note
>
> By default the connections to Neo4j are long lived. If you use Node 0.10, then this might not be the case and you will most likely get performance issues as you scale the amount of requests. This is not a problem with Node 0.12+ or iojs.

### Client

#### Client([options,] callback)
This is the constructor for our client. You can instantiate multiple versions of it with the same or different endpoints.

The options it can take are the following:
- `url` The url where the Neo4j database is listening
- `timeout` The timeout in ms for any HTTP request or response dealing with Neo4j
- `credentials` An object which includes `username` and `password` for authorization with Neo4j

The callback has the following properties:
- `error` If any errors occurred you will get an Error object
- `client`
  - Null if any errors occurred
  - The object you will use to interact with this library

```javascript
var Neo4j = require('neo4j-driver');
Neo4j.Client({ url: 'http://localhost:7474/db/data/' }, function (err, client) {

    // client.cypher
    // client.transact
})
```

> Note
>  
> The client does not give you options to change your password or do maintenance tasks. It is only meant for using during an application that does lots of queries and writes. If there are any issues, this first call to the constructor will fail.

#### cypher(query, [params,] callback)
This is a convenience method to run one cypher statement. In the background this actually invokes a transaction that does commit right away.

- `query` A Cypher statement represented as a string
- `params` Optional params object in case you used parameters in your cypher query
- `callback` When the query is done, returns a potential error object and results array
  - `error`
    - Null if there are no issues
    - An object (could be Error or not) if something went wrong during transport
    - Neo4j error array if errors were returned from Neo4j about your statements
  - `results`
    - Null if there were errors
    - An array returned from Neo4j containing the results of the statements

```javascript
client.cypher('MATCH (n:Person) RETURN n', function (err, results) {


});
```

#### transact()
Returns a new Transaction object. See below for its API.
```javascript
var transact = client.transact();
```

### Transaction
Create a transaction object by using `client.transact()`. If you want to use Transaction by itself (not recomended), then you can look at `test/transaction.js` and of course the constructor in `lib/transaction.js`.

#### transact(statements, [options,] callback)
This method allows you to run statements in the current transaction. See [Transaction Cypher HTTP endpoint](http://neo4j.com/docs/stable/rest-api-transactional.html) documentation for more details.

The statements are of this format:
```javascript
var statements = [
    {
        "statement": "CREATE (n {props}) RETURN n",
        "parameters": {
            "props": {
                "name": "My Node"
            }
        }
    },
    {
        "statement": "MATCH (n) RETURN n"
    }
];
```

The options object:
- `commit` true if you want to commit. False by default

The callback has the following properties:
- `error`
  - Null if no errors
  - An object if anything went wrong that is not related to Neo4j
  - An array of errors returned by Neo4j
- `results`
  - Array of results returned by Neo4j

```javascript
var Neo4j = require('neo4j-driver');
Neo4j.Client({}, function (err, client) {

    if (err) {
        console.log(err);
        process.exit(1);
    }

    var transaction = client.transact();
    transaction.transact(statements, function (error, results) {

        // look at your results
        transaction.rollback(function (err) {

            // rolled the transaction back
        };
    });
});
```

#### commit(statements, options, callback)
This is a helper method. It just calls the transact method with options `{ commit: true }`. See Transaction.transact for details.

#### rollback(callback)
Rolls back the current transaction. You cannot use the transact object after that. You can try, but Neo4j will return errors.

The callback has the following properties:
- `error` If error is null, then the rollback was successful

```javascript
transaction.rollback(function (error) {

});
```

#### extend(callback)
Sends a keep alive to Neo4j to extend the time of the transaction.

The callback has the following properties:
- `error` If error is null, then the extend was successful

```javascript
transaction.extend(function (error) {

});
```
