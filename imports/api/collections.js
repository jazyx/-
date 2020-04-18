import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';

// Export collections individually: import { Name } from '...'
export const L10n       = new Mongo.Collection('l10n')
export const Chat       = new Mongo.Collection('chat')
export const Users      = new Mongo.Collection('users')
export const Groups     = new Mongo.Collection('groups')
export const Teachers   = new Mongo.Collection('teachers')
export const Activities = new Mongo.Collection('activities')


// **** ADD COLLECTIONS FOR NEW ACTIVITIES HERE ...
export const Drag       = new Mongo.Collection('drag')

// Export a collections map: import arbitraryName from '...'
const collections = {
  L10n
, Chat
, Users
, Groups
, Teachers
, Activities

, Drag
}


// Define the queries that will be used to publish these collections
// in the standard way
const publishQueries = {
  L10n:       {}
, Chat:       {}
, Users:      {}
, Groups:     {}
, Teachers:   { $or: [
                  { file: { $exists: false } }
                , { file: { $ne: "xxxx" } }
                ]
              }
, Activities: {}

// **** ADD COLLECTIONS FOR NEW ACTIVITIES HERE ...
, Drag:       { $or: [
                  { file: { $exists: true } }
                , { folder: { $exists: true } }
                ]
              }
}


if (Meteor.isServer) {
  for (name in collections) {
    const query = publishQueries[name]
    const collection = collections[name]

    name = collection._name // name.toLowerCase()

    // The publication method is run each time a client subscribes to
    // the named collection. The subscription may be made directly or
    // through the /imports/api/methods.js script

    Meteor.publish(name, function public(caller, ...more) {
      let items = collection.find(query) // (customQuery || query)

      if (typeof caller === "string") {
        console.log(
          "Publishing", collection._name, "for", caller, ...more
        )
        console.log(
          collection.findOne(query, { limit: 4 })
        , collection.find(query).count()
        )
      }

      return items
    })
  }
}


export default collections
