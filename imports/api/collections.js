import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';



const collections = {
  L10n:       new Mongo.Collection('l10n')
, Users:      new Mongo.Collection('users')
, Groups:     new Mongo.Collection('groups')
, Teachers:   new Mongo.Collection('teachers')
, Activities: new Mongo.Collection('activities')

// **** ADD COLLECTIONS FOR NEW ACTIVITIES HERE ...
, Drag:       new Mongo.Collection('drag')
}

const publishQueries = {
  L10n:       {}
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

    // console.log(name, collection.find().count())

    Meteor.publish(name, () => {
      const items = collection.find(query)

      // console.log(
      //   "Request for", collection._name, query
      // , items.count(), "items served"
      // )

      return items
    })
  }
}


export default collections