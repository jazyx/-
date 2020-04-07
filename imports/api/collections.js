import { Mongo } from 'meteor/mongo';

const collections = {
  Users:      new Mongo.Collection('users')
, L10n:       new Mongo.Collection('l10n')
, Teachers:   new Mongo.Collection('teachers')
, Activities: new Mongo.Collection('activities')

// **** ADD COLLECTIONS FOR NEW ACTIVITIES HERE ...
, Drag:       new Mongo.Collection('drag')
}

const publishQueries = {
  Users:      {}
, L10n:       {}
, Teachers:   {}
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

    Meteor.publish(name, () => {
      const items = collection.find(query)

      console.log(
        "Request for", collection._name, query
      , items.count(), "items served"
      )

      return items
    })
  }
}


export default collections