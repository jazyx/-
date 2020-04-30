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

let Points // MongoDB-free collection



/// METHODS // METHODS // METHODS // METHODS // METHODS // METHODS ///


export const createTracker = {
  name: "points.createTracker"

, call(trackerData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [trackerData], options, callback)
  }

, validate(trackerData) {
    new SimpleSchema({
      _id:      { type: String } // d_code for user|teacher's device
    , color:    { type: String }
    , group_id: { type: String }
    }).validate(trackerData)
  }

  /** Create a document for the current User in group group_id
   *
   *  The _id of the new document will be stored in the Client. Each
   *  time the User moves the mouse or drags the mouse or a touch
   *  point on the screen, the x, y and other properties of this
   *  document will be updated. All Users and Teachers connected to
   *  group group_id will be able to display the cursor/touch position
   *  of this User on their screen.
   */

, run(trackerData) {
    const _id = Points.insert( trackerData )

    return _id // should be same as trackerData._id
  }
}


export const update = {
  name: "points.update"

, call(pointData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [pointData], options, callback)
  }

, validate(pointData) {
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

, run(pointData) { // {_id, group_id, x, y, active }
    const _id = pointData._id
    Points.update({ _id }, { $set: pointData }) // not _id, number
  }
}


export const destroyTracker = {
  name: "points.destroyTracker"

, call(trackerData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [trackerData], options, callback)
  }

, validate(trackerData) {
    new SimpleSchema({
      _id:      { type: String } // d_code for user|teacher's device
    , group_id: { type: String }
    }).validate(trackerData)
  }

, run(trackerData) {
    const { group_id } = trackerData
    const result = Points.remove( trackerData )

    console.log("Points.remove("
               + JSON.stringify(trackerData)
               + ") =>"
               + "result:", result)

    const members = Points.find({ group_id }, {}).fetch()
    if (members.length < 2) {
      Points.remove({ group_id })
    }

    return false
  }
}


export const clearPoints = {
  name: "points.clear"

, call(trackerData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [trackerData], options, callback)
  }

, validate() {}

, run(trackerData) {
    const result = Points.remove( {} )

    console.log("Points.remove( {} ) =>"
               + "result:", result)
    return result
  }
}


const methods = [
  createTracker
, update
, destroyTracker
, clearPoints // Debug only
]


methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      method.validate.call(this, args)
      return method.run.call(this, args)
    }
  })
})


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

  // REMOVE Debug Only // REMOVE Debug Only // REMOVE Debug Only //
  window.Points = Points
  window.clearPoints = clearPoints
}


export default Points