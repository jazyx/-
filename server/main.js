import { Meteor } from 'meteor/meteor'
import '../imports/api/methods/methods'
import '../imports/ui/activities/combinedMethods'
import collections from '../imports/api/collections.js'
import Points from '../imports/api/points'

// console.log("Server's main.js instanciated")

// Required by CollectJSON
const fs = require('fs')
const path = require('path')


/**
 * @class  CollectJSON (name)
 *
 * A CollectJSON instance expects to receive a relative path to
 * a file in the AppName/private/ folder. This path should lead to a
 * JSON file, with the format shown in the _treatJSON method.
 *
 * • The value of collection should be one of the capitalized
 *   collection names defined in AppName/imports/api/collection.js
 * • An as_is object with at least a version number must be included
 * • If the version indicated in the `as_is` entry is greater than the
 *   version number currently stored in the given collection, all the
 *   existing values will be removed and will be replaced by the
 *   new ones.
 */
class CollectJSON {
  constructor (jsonFile) {
    this.jsonFile = jsonFile
    // console.log("CollectJSON", jsonFile)
    this._treatJSON = this._treatJSON.bind(this)
    this._checkResult = this._checkResult.bind(this)
    Assets.getText(jsonFile, this._treatJSON)
  }

  _treatJSON(error, data) {
    if (error) {
      return console.log("_treatJSON", error)
    }

    let json
    try {
      json = JSON.parse(data)
    } catch(error) {
      return console.log("JSON.parse\n", this.jsonFile, "\n", error)
    }

    // console.log(json)
    // { "collection": "Collection" // target for new documents
    //
    // , "as_is": { // document will be added as is
    //     "version": <number>
    // [ , "key": "<type of documents to be added>" ]
    //   , ...
    //   }
    //
    //   // CAUTION: these entries cannot be updated automatically
    // , "<key>": "<value>" // will be added as { <key>: <value> }
    //
    // , "<type>: [         // each entry will be added as a separate
    //                      // document with the type "<type>" and
    //                      // the version <as_is.version>
    //     { "<key>": "<value>"
    //     , ...
    //     }
    //   , ...
    //   ]
    // ]

    const collection = collections[json.collection]
    if (!collection) {
      console.log("Collection", json.collection)
      return console.log("missing for", this.jsonFile)
    }

    delete json.collection

    let version
    if (version = this._versionIsNewer(collection, json.as_is)) {
      this._deleteOlderItems(collection, json.as_is.key, version)
      this._insertNewItems(collection, json, version)
    }
  }


  _versionIsNewer(collection, as_is) {
    let key
      , version

    // Refuse to import documents unless:
    // * There is an as_is object...
    // * ... which contains a non-zero version
    if (!as_is || typeof as_is !== "object") {
      return false
    } else if (!(version = as_is.version)) {
      return false
    }

    let versionSelect = { version: { $exists: true }}
    if (key = as_is.key) {
      versionSelect = {
        $and: [
          versionSelect
        , { key: { $eq: key }}
        ]
      }
    }
    const document = collection.findOne(versionSelect)
    // console.log("**",collection._name)

    if (document) {
      if (version <= document.version) {
        return false

      } else {
        console.log(
          "Older version", document.version
        , "of", key||collection._name, "is about to be removed"
        , "and replaced with version", version)
      }
    }

    return version
  }


  _deleteOlderItems(collection, key, version) {
    let deleteSelect = { version: { $lt: version } }

    if (key) {
      deleteSelect = {
       $and: [
          deleteSelect
        , { $or: [
              { key: { $eq: key }}   // deletes as_is entry
            , { type: { $eq: key }}  // deletes all associated images
            ]
          }
        ]
      }
    }

    const collectionName = key || collection._name
    const callback = (e, d) => this._checkResult(e, d, collectionName)
    collection.remove(deleteSelect, callback)
  }


  _insertNewItems(collection, json, version) {
    const keys = Object.keys(json)
    let counter = 0

    keys.forEach(key => {
      const value = json[key]

      if (Array.isArray(value)) {
        value.forEach(document => {
          document.type = key
          document.version = version
          collection.insert(document)
          counter += 1
        })

      } else if (key === "as_is") {
        collection.insert( value )
        counter += 1

      } else { // Use with caution. Old documents will not be cleared.
        collection.insert({ [key]: value })
         counter += 1
      }
    })

    console.log("Added", counter, "items to", collection._name)
  }


  _checkResult(error, data, key) {
    console.log("Removed", data, "items from", key, "error:", error)
  }
}



/**
 * Adds to `list` all documents with the extension `type` found in
 * folder or any of its subfolders
 *
 * @param      {string}  folder   The folder to search in
 * @param      {string}  type     ".json" or any extension starting
 *                                with a dot
 * @param      {array}   list     An (empty) array
 * @return     {Array}            The input list, now populated with
 *                                absolute paths to files of the
 *                                given type
 */
const crawl = ({ folder, type, list }) => {
  const addToList = (contents) => {
    contents.forEach(item => {
      const itemPath = path.join(folder, item)
      if (path.extname(itemPath) === type) {
        list.push(itemPath)

      } else {
        crawl({
         folder: itemPath
       , type
       , list
       })
      }
    })
  }

  const checkContents = (folder) => {
    const data = fs.statSync(folder)
    if (data.isDirectory()){
      const contents = fs.readdirSync(folder)
      addToList(contents)
    }
  }

  checkContents(folder)
  return list
}




Meteor.startup(() => {
  //// NOTE: Using "assets/app" results in relative paths.
  ////       Placing an empty file called "doNOTdelete" and getting
  ///        its absolute path means that folder is an absolute path,
  ///        which is what crawl() requires, since it uses fs methods
  let folder =  Assets.absoluteFilePath("doNOTdelete")
                      .replace(/doNOTdelete$/, "json")

  // console.log("Activities folder:", folder)
  // /home/.../.meteor/local/build/programs/server/assets/app/json/
  const options = {
    folder
  , type: ".json"
  , list: []
  }

  // crawl() will return absolute paths, but Asset.getText() in
  // CollectJSON requires relative paths from the `private` folder
  // which is bundled as  `.../assets/app/`
  const jsonFiles = crawl(options)
                    .map(file => file.replace(/.*assets\/app\//, ""))

  jsonFiles.forEach(jsonFile => {
    new CollectJSON(jsonFile)
  })
});
