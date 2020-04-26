/**
 * /imports/api/points.js
 *
 * This script manages the Points collection, which shares the
 * positions of each user's mouse or touch actions. The collection
 * bypasses the MongoDB database. As a result, it cannot use the
 * built-in collection methods such as insert() and remove().
 *
 * Points is exported differently on the server and on the client.
 * The server uses a null connection to prevent it from synchronizing
 * with MongoDB, but the client needs its default connection in order
 * to communicate with the server ({ connection: undefined })
 *
 * See...
 *   http://richsilv.github.io/meteor/meteor-low-level-publications/
 * ... for more details.
 */


import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'


///// COLLECTION //// COLLECTION //// COLLECTION //// COLLECTION /////

let Points


if (Meteor.isServer) {
  Points = new Meteor.Collection('points', { connection: null })

  Meteor.publish('overDPP', function(){
    // `publish` requires the classic function() {} syntax for `this`
    const subscription = this

    const publication = Points.find({}).observeChanges({
      added: function (id, fields) {
        subscription.added("points", id, fields)
      },
      changed: function(id, fields) {
        subscription.changed("points", id, fields)
      },
      removed: function (id) {
        subscription.removed("points", id)
      }
    })

    subscription.ready()

    subscription.onStop(() => {
      publication.stop()
    })
  })
}


if (Meteor.isClient) {
  Points = new Meteor.Collection('points') // connection undefined
  Meteor.subscribe('overDPP')
  window.Points = Points // REMOVE
}



/// METHODS // METHODS // METHODS // METHODS // METHODS // METHODS ///


export const createTracker = {
  name: "createTracker"

, call(callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [], options, callback)
  }

, validate: () => {}

, run() {
    const number = Points.find().count()
    const _id = Points.insert({ number })

    return _id
  }
}


export const update = {
  name: "update"

, call(pointData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [pointData], options, callback)
  }

, validate(pointData) {
    if (pointData.touchend) {
      new SimpleSchema({
        _id:      { type: String }
      , group_id: { type: String }
      , active:   { type: Boolean, custom() {
          if ( this.value ) {
            return "activeAndTouchedMustBothBeFalse";
          }
        }}
      , touchend: { type: Boolean }
      }).validate(pointData)

    } else {
      new SimpleSchema({
        _id:      { type: String }
      , group_id: { type: String }
      , x:        { type: Number }
      , y:        { type: Number }
      , active:   { type: Boolean }
      , touchend: { type: Boolean }
      , touch:    { type: Object, optional: true, blackbox: true }
      }).validate(pointData)

      if (pointData.touch) {
        new SimpleSchema({
          radiusX:       { type: Number }
        , radiusY:       { type: Number }
        , rotationAngle: { type: Number }
        }).validate(pointData.touch)
      }
    }
  }

, run(pointData) { // {_id, group_id, x, y, active }
    const _id = pointData._id
    Points.update({ _id }, { $set: pointData }) // not _id, number
  }
}


const methods = [
  createTracker
, update
]

methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      method.validate.call(this, args)
      return method.run.call(this, args)
    }
  })
})


export default Points