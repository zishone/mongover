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

<br/>

**Initializing a Mongover Repository:**
```shell
$ mongover init myFirstMongover
$ cd myFirstMongover
```

**Applying a Mongover Specification to the server:**
```shell
$ mongover apply
```

## Mongover Specification File
Located inside a Mongover Repositry is the Mongover Specification File named `mongover.json`. Modify this file according to the needs of your databases.

**Mongover Specification File Example:**
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