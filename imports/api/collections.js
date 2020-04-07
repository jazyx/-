import { Mongo } from 'meteor/mongo';

const collections = {
  L10n:       new Mongo.Collection('l10n')
, Teachers:   new Mongo.Collection('teachers')
, Activities: new Mongo.Collection('activities')

// **** ADD COLLECTIONS FOR NEW ACTIVITIES HERE ...
, Drag:       new Mongo.Collection('drag')
}

export default collections