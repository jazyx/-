import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';

// Export collections individually: import { Name } from '...'
export const L10n       = new Mongo.Collection('l10n')
export const Chat       = new Mongo.Collection('chat')
export const Users      = new Mongo.Collection('users')
export const Groups     = new Mongo.Collection('groups')
export const Counters   = new Mongo.Collection('counters')
export const Teachers   = new Mongo.Collection('teachers')
export const Activities = new Mongo.Collection('activities')

export const getNextIndex = (_id) => {
  let inc = 1

  if (Meteor.isMeteor) {
    Counters.upsert(
      { _id }
    , { $inc: { index: inc }}
    )

    inc = 0
  }

  const index = (Counters.findOne({ _id })) || { index:0 }.index + inc

  return index
}

// <<< DEVELOPMENT ONLY // DEVELOPMENT ONLY // DEVELOPMENT ONLY //
if (Meteor.isClient) {
  window.Users = Users
  window.Groups = Groups
  window.getNextIndex = getNextIndex
}
// DEVELOPMENT ONLY // DEVELOPMENT ONLY // DEVELOPMENT ONLY >>> //


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
// Specific activities
, Drag
}

// console.log(collections)


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
    const select = publishQueries[name]
    const collection = collections[name]

    name = collection._name // name.toLowerCase()

    // The publication method is run each time a client subscribes to
    // the named collection. The subscription may be made directly or
    // through the /imports/api/methods.js script

    Meteor.publish(name, function public(caller, ...more) {
      // We need to use the classic function () syntax so that we can
      // use this to access the Meteor connection and use this.user_id

      let items = collection.find(select) // (customSelect || select)

      if (typeof caller === "string") {
        console.log(
          "Publishing", collection._name, "for", caller, ...more
        )
        console.log(
          "Items 1 - 4 /"
        , collection.find(select).count()
        , collection.find(select, { limit: 4 }).fetch()
        )
      }

      return items
    })
  }
}


export default collections
