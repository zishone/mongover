# mongover
A MongoDB Server Database Migration Tool

## Installation
```shell
$ npm i -g mongover
```
Or use [npx](https://medium.com/@ma1ybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) (comes with npm 5.2+ and higher) instead.

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

**Applying a Mongover Specification to the MongoDB Server:**
```shell
$ mongover apply
```

## Mongover Specification File
Located inside a Mongover Repository is the Mongover Specification File named `mongover.json`. Modify this file according to the needs of your databases.

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
            "fieldNameNum": {
              "type": "number"
            },
            "fieldNameBool": {
              "type": "boolean"
            },
            "fieldNameObj": {
              "type": "object",
              "fields": {
                ...
              }
            },
            "fieldNameStrNumBoolObjArrNull": {
              "type": [
                "string",
                "number",
                "boolean",
                "object",
                "array",
                "null"
              ],
              "fields": {
                ...
              },
              "items": {
                "type": "any"
              }
            },
            "fieldNameAny": {
              "type": "any"
            },
            "fieldNameNull": {
              "type": "null"
            },
            "fieldNameArr": {
              "type": "array",
              "items": {
                "type": "any"
              }
            },
            ...
          },
          "options": {},
          "upsertFields": [
            "fieldNameStr",
            ...
          ],
          "ignoreFields": [
            "fieldNameStr",
            ...
          ],
          "preserveObjectId": false,
          "dropIndexesFirst": false,
          "indexes": {
            "indexName": {
              "keys": {
                "fieldNameStr": 1
              },
              "options": {},
              "dropFirst": false
            },
            ...
          },
          "dropFirst": false
        },
        ...
      },
      "dropFirst": false
    },
    ...
  },
  "servers": {
    "serverName": {
      "mongoUri": "mongodb://user:password@127.0.0.1:27017/?authSource=admin",
      "databases": [
        "dbName",
        ...
      ]
    },
    ...
  }
}
```