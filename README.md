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
$ mongover init myMongoverRepo
$ cd myMongoverRepo
```

**Applying a Mongover Specification to the MongoDB Server:**
```shell
$ mongover apply
```

## Mongover Repository
    .
    ├── data                    # Data Directory
    │   ├── dbName              # Export files to be upserted to dbName
    │   │   ├── colName.jsonl   # Export file to be upserted to colName (alternatively `json|csv`)
    │   │   └── ...
    │   └── ...
    └── mongover.json           # Mongover Specification JSON
### Data Directory
Structured as previewed above. 

Can be populated using [mongoexport](https://docs.mongodb.com/manual/reference/program/mongoexport/).
```shell
$ mongoexport --db dbName --collection colName --out <path-to-mongover-repo>/data/dbName/colName.jsonl
```
Or by writing a [jsonl](http://jsonlines.org/) file manually.

### Mongover Specification JSON
Modify this file according to the needs of your databases.
```json5
{
  "databases": {
    "dbName": {
      "collections": {
        "collectionName": {
          "options": {},
          "upsertFields": [
            "fieldNameStr"
          ],
          "ignoreFields": [
            "fieldNameStr"
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
      "mongoUri": "mongodb://127.0.0.1:27017/",
      "databases": [
        "dbName"
      ]
    },
    ...
  }
}
```