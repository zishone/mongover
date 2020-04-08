# mongover [![NPM](https://img.shields.io/npm/v/mongover)](https://www.npmjs.com/package/mongover) [![Build Status](https://travis-ci.org/zishone/mongover.svg?branch=master)](https://travis-ci.org/zishone/mongover) [![Coverage Status](https://coveralls.io/repos/github/zishone/mongover/badge.svg?branch=master)](https://coveralls.io/github/zishone/mongover?branch=master) [![License](https://img.shields.io/npm/l/mongover)](https://github.com/zishone/mongover/blob/master/LICENSE)
A MongoDB Database Server Seeder and Migration Tool.

## Introduction
`mongover` is a set of tools that can be used as a module dependency for NodeJS applications or as a command line interface tool for the purpose of seeding and migrating MongoDB databases.

## API
### Installation
```shell
$ npm i mongover
```
### Usage
#### 1. Import mongover
```javascript
const { apply } = require('mongover');
```
#### 2. Define MongoverOptions
```javascript
const options = {
  specPath: './mongover',
  uri: 'mongodb://127.0.0.1:27017/',
  seedOnly: false
};
```
| MongoverOptions 	| Type    	| Description                                                                    	| Default                    	|
|---------------	|---------	|--------------------------------------------------------------------------------	|----------------------------	|
| uri      	        | string  	| MongoDB Server connection string.                                              	| mongodb://127.0.0.1:27017/ 	|
| specPath 	        | string  	| Path to Mongover Specification.                                                	| ./mongover                 	|
| seedOnly      	| boolean 	| Specifies if mongover should only seed instead of migrating existing database. 	| false                      	|

#### 3. Apply Mongover Specification
```javascript
await apply(options);
```

## CLI
### Installation
```shell
$ npm i -g mongover
```
### Usage
```shell
$ mongover <command> [<args>] [<options>]
```
#### Commands
* **init**: initializes a new Mongover Specification
  
  **SYNOPSIS**

  ```shell
  $ mongover init [<specPath>] [-f dir|-f json]
  ```

  **ARGUMENTS**

      <specPath>                path to Mongover Specification. Defaults to `./mongover`.

  **OPTIONS**

      -f or --format            specifies Mongover Specification format, choose between `dir` and `json`. Defaults to `dir`.

* **extract**: extracts the Mongover Specification of an existing MongoDB Server and initializes a new Mongover Repository with it.
  
  **SYNOPSIS**

  ```shell
  $ mongover extract [<specPath>] [-u "<uri>"] [-d <dbName>[,...] [-c <collectionName>[,...]]] [-f dir|-f json] [-e jsonl|-e json|-e no [-q "<query>"]] 
  ```

  **ARGUMENTS**

      <specPath>                path to Mongover Specification. Defaults to `./mongover`.

  **OPTIONS**

      -u or --uri               specifies the uri of the running mongod or mongos. Defaults to 'mongodb://127.0.0.1:27017/'.

      -d or --dbs               specifies which databases are to be extracted.

      -c or --collections       specifies which collections are to be extracted. Defaults to all collections in specified databases.

      -f or --format            specifies Mongover Specification format, choose between 'dir' and 'json'. Defaults to 'dir'.

      -e or --export            specifies if data from the MongoDB Server should also be exported, choose between 'jsonl', 'json' and 'no'. Defaults to 'no'.

      -q or --query             specifies a filter which data to be exported from the MongoDB Server.
     
* **apply**: applies the current Mongover Specification to the MongoDB Server.
  
  **SYNOPSIS**

  ```shell
  $ mongover apply [<specPath>] [-u "<uri>"] [-d <dbName>[,...] [-a <alias>[,...]]] [-c <collectionName>[,...]] [-s]
  ```

  **ARGUMENTS**

      <specPath>                path to Mongover Specification. Defaults to current working directory.

  **OPTIONS**

      -u or --uri               pecifies the uri of the running mongod or mongos. Defaults to 'mongodb://127.0.0.1:27017/'.

      -d or --dbs               specifies which databases to apply. Defaults to all databases in the Mongover Specification.

      -a or --alias             specifies the aliases of the specified databases to apply, a database will use the alias corresponding to its index separated by commas.

      -c or --collections       specifies which collections to apply. Defaults to all collections in specified databases.

      -s or --seedOnly          specifies if mongover should only seed the database instead of migrating it when it already exists.

      -m or --migrateForce      specifies if mongover should migrate the database even if the specified version is the same.

      -i or --infoCollection    specifies the collection name of the database information such as it's version. Defaults to '_mongover'.

* **help**: outputs Mongover usage.
  
  **SYNOPSIS**

  ```shell
  $ mongover help
  ```


## Mongover Specification
### **Format: `dir`**
#### File Structure
    .
    ├── dbName/                           # Database Directory
    │   ├── data/             
    │   │   ├── collectionName.jsonl      # Export file to be upserted to dbName.collectionName (alternatively `json|js`)
    │   │   └── ...
    │   ├── collections/
    │   │   ├── collectionName.spec.json  # Collection Migration/Seeding Specification file
    │   │   └── ...
    │   └── db.spec.json                  # Database Migration/Seeding Specification file
    └── ...

* **db.spec.json**
    ```json5
    {
        "seedOnly": false,                  // Specifies if existing database should be migrated or only seeded.
        "dropFirst": false,                 // Specifies if existing database should be dropped before specification is applied.
        "alias": "dbName",                  // Alias/Name the database specification will be deployed as.
        "version": "1.0.0"             // Specifies the version of the database, this will determine if the database needs to be migrated or not.
    }
    ```

* **collectionName.spec.json**
    ```json5
    {
        "dropFirst": false,                  // Specifies if the Collection should be dropped before specification is applied.
        "dropIndexesFirst": false,           // Specifies if all the Indexes of the Collection should be dropped before specification is applied.
        "options": {},                       // Create Collection Options. See: http://mongodb.github.io/node-mongodb-native/3.2/api/Db.html#createCollection
        "indexes": [
            {
                "dropFirst": false,          // Specifies if Index with same name should  be dropped before specification is applied.
                "keys": {                    // Specify keys to be indexed. See: https://docs.mongodb.com/manual/indexes/#index-types
                    "fieldName": 1        
                },
                "options": {                 // Create Index Options. See: http://mongodb.github.io/node-mongodb-native/3.2/api/Db.html#createIndex
                    "name": "fieldName_1"
                }
            }
        ],
        "data": {
            "preservePrimaryKey": true,      // Specifies if _id from export file should be preserved when applied.
            "upsertFields": [                // Specify fields to be used to check if a document exists in the collection and used as filter to update the document.
                "fieldName" 
            ],
            "ignoreFields": [                // Specify fields to be ignored when updating existing documents.
                "fieldName"
            ]
        }
    }
    ```

### **Format: `json`**
#### File Structure
    .
    ├── dbName/                           # Database Directory
    │   ├── data/             
    │   │   ├── collectionName.jsonl      # Export file to be upserted to dbName.collectionName (alternatively `json|js`)
    │   │   └── ...
    │   └── db.spec.json                  # Database Migration/Seeding Specification file
    └── ...

* **db.spec.json**
    ```json5
    {
        "seedOnly": false,                    // Specifies if existing database should be migrated or only seeded.
        "dropFirst": false,                   // Specifies if existing database should be dropped before specification is applied.
        "alias": "dbName",                    // Alias/Name the database specification will be deployed as.
        "version": "1.0.0",              // Specifies the version of the database, this will determine if the database needs to be migrated or not.
        "collections": {
            "dropFirst": false,               // Specifies if the Collection should be dropped before specification is applied.
            "dropIndexesFirst": false,        // Specifies if all the Indexes of the Collection should be dropped before specification is applied.
            "options": {},                    // Create Collection Options. See: http://mongodb.github.io/node-mongodb-native/3.2/api/Db.html#createCollection
            "indexes": [
                {
                    "dropFirst": false,       // Specifies if Index with same name should  be dropped before specification is applied.
                    "keys": {                 // Specify keys to be indexed. See: https://docs.mongodb.com/manual/indexes/#index-types
                        "fieldName": 1        
                    },
                    "options": {              // Create Index Options. See: http://mongodb.github.io/node-mongodb-native/3.2/api/Db.html#createIndex
                        "name": "fieldName_1"
                    }
                }
            ],
            "data": {
                "preservePrimaryKey": true,   // Specifies if _id from export file should be preserved when applied.
                "upsertFields": [             // Specify fields to be used to check if a document exists in the collection and used as filter to update the document.
                    "fieldName" 
                ],
                "ignoreFields": [             // Specify fields to be ignored when updating existing documents.
                    "fieldName"
                ]
            }
        }
    }
    ```

## Data Export File
* **jsonl**
    ```json
    {"_id":{"$oid":"aaaaaaaaaaaaaaaaaaaaaaaa"},"fieldName": 1}
    ```

* **json**
    ```json
    [
        {
            "_id": {
                "$oid": "aaaaaaaaaaaaaaaaaaaaaaaa"
            },
            "fieldName": 1
        }
    ]
    ```

* **js**
    ```javascript
    module.exports = [
        {
            _id: {
                $oid: 'aaaaaaaaaaaaaaaaaaaaaaaa'
            },
            fieldName: 1
        }
    ];
    ```

## Authors
* **Zishran Julbert Garces**

See also the list of [contributors](https://github.com/superzish/mongover/contributors) who participated in this project.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/superzish/mongover/blob/master/LICENSE) file for details.
