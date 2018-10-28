# mongover
A MongoDB Server Database Migration Tool

## Installation
```shell
npm i -g mongover
```

## Usage
```shell
$ mongover <command> [<args>]
```

| Commands          | Descriptions                                                     |
| ----------------- | ---------------------------------------------------------------- |
| help              | shows usage                                                      |
| init [&lt;path>]  | initializes a new Mongover Repository                            |
| apply [&lt;path>] | applies the current Mongover Specification to the MongoDB Server |

---
After initializing a repository:
```shell
$ mongover init myFirstMongover
$ cd myFirstMongover
```

Modify the specification file `mongover.json` according to the schema of your database.

After your modifications, you can apply the specification file to your server:
```shell
$ mongover apply
```

## Mongover Specification JSON Example
```json5
{
  "databases": {
    "dbName": {
      "collections": {
        "collectionName": {
          "fields": {
            "fieldNameStr": {
              "type": "string"
            },
            "fieldNameObj": {
              "type": "object",
              "fields": {
                "fieldNameBool": {
                  "type": "boolean"
                }
              }
            },
            "fieldNameArr": {
              "type": "array",
              "items": {
                "type": "number"
              }
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