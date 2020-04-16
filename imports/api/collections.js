import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';

// Export collections individually: import { Name } from '...'
export const L10n       = new Mongo.Collection('l10n')
export const Chat       = new Mongo.Collection('chat')
export const Users      = new Mongo.Collection('users')
export const Groups     = new Mongo.Collection('groups')
export const Teachers   = new Mongo.Collection('teachers')
export const Activities = new Mongo.Collection('activities')

const connection    = null
export const Points = new Meteor.Collection('points', {connection})

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
, Points

, Drag
}

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
, Points:     {}

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

    Meteor.publish(name, function publication(caller, customQuery){
      let items

      if (customQuery) {
        // Use the custom query, assuming it to be valid
        console.log(
          "Publishing", collection._name
        , "for", caller, "with", customQuery
        )
        items = collection.find(customQuery)

      } else {
        items = collection.find(query)
      }

      return items
    })
  }
}


export default collections