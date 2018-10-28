# mongover
A MongoDB Server Database Specification Tool

## Installation
```shell
npm i -g mongover
```

## Usage
```shell
mongover <command> [<args>]
```

| Commands          | Descriptions                                                 |
| ----------------- | ------------------------------------------------------------ |
| help              | shows usage                                                  |
| init [&lt;path>]  | initializes a new Mongover Repository                        |
| apply [&lt;path>] | applies current Mongover Specification to the MongoDB Server |

## Mongover Specification JSON Example
```json5
{
  "databases": {
    "dbName": {
      "collections": {
        "collectionName": {
          "fields": {
            "fieldName": {
              "type": "string"
            },
            // ...
          },
          "options": {},
          "upsertFields": [
            "fieldName",
            // ...
          ],
          "ignoreFields": [
            "fieldName",
            // ...
          ],
          "preserveObjectId": false,
          "dropIndexesFirst": false,
          "indexes": {
            "indexName": {
              "keys": {
                "fieldName": 1
              },
              "options": {},
              "dropFirst": false
            },
            // ...
          },
          "dropFirst": false
        },
        // ...
      },
      "dropFirst": false
    },
    // ...
  },
  "servers": {
    "serverName": {
      "mongoUri": "mongodb://user:password@127.0.0.1:27017/?authSource=admin",
      "databases": [
        "dbName",
        // ...
      ]
    },
    // ...
  }
}
```