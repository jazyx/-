import { Mongo } from 'meteor/mongo';

const collections = {
  L10n:       new Mongo.Collection('l10n')
, Teachers:   new Mongo.Collection('teachers')
, Activities: new Mongo.Collection('activities')

// **** ADD COLLECTIONS FOR NEW ACTIVITIES HERE ...
, Drag:       new Mongo.Collection('drag')
}


if (Meteor.isServer) {
  for (name in collections) {
    const collection = collections[name]
    name = collection._name // name.toLowerCase()

    Meteor.publish(name, () => {
      console.log(name, collection.find({}).count())
      return collection.find({})
    })
  }
}


export default collections