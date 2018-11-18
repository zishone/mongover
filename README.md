# mongover
A MongoDB Server Database Migration Tool

## Description
`mongover` is a command line tool that allows specifying MongoDB Schema via a json format and apply it to the MongoDB Server(s) making MongoDB Database Versioning and Migration convenient.

## Getting Started
### Prerequisites
* Node 6.x or higher

### Installation
```shell
$ npm i -g mongover
```
Or instead use [npx](https://medium.com/@ma1ybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) (comes with npm 5.2+ and higher).

## Usage
```shell
$ mongover <command> [<args>] [<options>]
```

### Commands
* **init**: initializes a new Mongover Repository
  
  **SYNOPSIS**

  ```shell
  $ mongover init [<path>] [-f json|-f dir]
  ```

  **ARGUMENTS**

      <path>              path to mongover repository. Defaults to current working directory.

  **OPTIONS**

      -f or --format      specifies Mongover Specification format, choose between `json` and `dir`. Defaults to `json`.

* **extract**: extracts the Mongover Specification of an existing MongoDB Server and initializes a new Mongover Repository with it.
  
  **SYNOPSIS**

  ```shell
  $ mongover extract [<path>] [[-h <host>] -u <username> -p <password> --authsource <authsource>] -d <dbName>[,...] [-c <collectionName>[,...]] [-q "<query>"[,...]] [-f json|-f dir] [-e yes|-e no] 
  ```

  **ARGUMENTS**

      <path>              path to mongover repository. Defaults to current working directory.

  **OPTIONS**

      -h or --host        specifies the host of the host machine where the mongod or mongos is running. Defaults to `127.0.0.1:27017`.

      -u or --username    specifies a username with which to authenticate to a MongoDB database that uses authentication.

      -p or --password    specifies a password with which to authenticate to a MongoDB database that uses authentication.

      --authsource        specifies the database in which the user is created.

      -d or --db          specifies which databases are to be extracted.

      -c or --collection  specifies which collections are to be extracted. Defaults to all collections in specified databases.

      -f or --format      specifies Mongover Specification format, choose between `json` and `dir`. Defaults to `json`.

      -e or --data        specifies if data from the MongoDB Server should also be exported, choose between `yes` and `no`. Defaults to `yes`.
     
* **apply**: applies the current Mongover Specification to the MongoDB Server.
  
  **SYNOPSIS**

  ```shell
  $ mongover apply [<path>] [-h <host> [-u <username> -p <password> --authsource <authsource>]|-s <serverName>[,...]] [-d <dbName>[,...] [--as <asDbName>[,...]]] [-c <collectionName>[,...]]
  ```

  **ARGUMENTS**

      <path>               path to mongover repository. Defaults to current working directory.

  **OPTIONS**

      -h or --host         specifies the host of the host machine where the mongod or mongos is running. Defaults to all servers in Mongover Specification.

      -u or --username     specifies a username with which to authenticate to a MongoDB database that uses authentication.

      -p or --password     specifies a password with which to authenticate to a MongoDB database that uses authentication.

      --authsource         specifies the database in which the user is created.

      -s or --server       specifies which servers in the Mongover Specification to connect to. Defaults to all servers in Mongover Specification.

      -d or --db           specifies which databases to apply. Defaults to all databases in the Mongover Specification.

      --as                 specifies the aliases of the specified databases to apply, a database will use the alias corresponding to its index separated by commas.

      -c or --collection   specifies which collections to apply. Defaults to all collections in specified databases.

### Mongover Repository
    .
    ├── data/                             # Data Directory
    │   ├── dbName/             
    │   │   ├── collectionName.jsonl      # Export file to be upserted to dbName.collectionName (alternatively `json|csv`)
    │   │   └── ...
    │   └── ...
    └── mongover.json|mongover/           # Mongover Specification json | Mongover Specification dir

#### Mongover Specification json
Modify this file according to the needs of your databases.
```json5
{
  "databases": {
    "dbName": {                                      // Modify this according to the needs of your database
      "collections": {                                
        "collectionName": {                          // Modify this according to the needs of your collection
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
            "indexName": {                            // Modify this according to the needs of your index
              "keys": {
                "fieldNameStr": 1
              },
              "options": {},
              "dropFirst": false
            },
            ...                                       // Add more indexName for more index specifications
          },
          "dropFirst": false
        },
        ...                                           // Add more collectionName for more collection specifications
      },
      "dropFirst": false
    },
    ...                                               // Add more dbName for more database specifications
  },
  "servers": {
    "serverName": {                                   // Modify this according to the needs of your server
      "mongoUri": "mongodb://127.0.0.1:27017/",
      "databases": [
        "dbName",
        {
          "db": "dbName",
          "as": "dbNameTwo"
        }
      ]
    },
    ...                                                // Add more serverName for more server specifications
  }
}
```

#### Mongover Specification dir
    .
    └── mongover/                           # Mongover Specification dir
        ├── databases/
        │   ├── dbName/
        │   │   ├── collectionName.json     # Modify this according to the needs of your collection
        │   │   └── ...                     # Add more collectionName.json for more collection specififcations
        │   └── ...                         # Add more dbName/ for more database specifications
        └── servers/
            ├── serverName.json             # Modify this according to the needs of your server
            └── ...                         # Add more serverName.json for more server specifications

## Authors
* **Zishran Julbert Garces**

See also the list of [contributors](https://github.com/superzish/mongover/contributors) who participated in this project.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/superzish/mongover/blob/master/LICENSE) file for details.
