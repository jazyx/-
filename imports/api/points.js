/**
 * /imports/api/points.js
 *
 * This script manages the Points collection, which shares the
 * positions of each user's mouse or touch actions. The collection
 * bypasses the MongoDB database. As a result, it cannot use the
 * built-in collection methods such as insert() and remove().
 * 
 * 
 * See...
 *   http://richsilv.github.io/meteor/meteor-low-level-publications/
 * ... for more details.
 */


import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'
import { getUnused } from '../tools/utilities'


// COLLECTION / COLLECTION / COLLECTION / COLLECTION / COLLECTION //

const name        = "points"
const publishName = name[0].toUpperCase + name.substring(1)
let Points // collection to export


// PUBLICATION (with low-level API) and SUBSCRIPTION // PUB / SUB //

if (Meteor.isServer) {
  const options = 
  Points = new Meteor.Collection(name, { connection: null })

  console.log("Publishing Points...")

  const pointsFunction = (filter) => {
    console.log("pointsFunction", this)
    const self = this

    const methods = {
      added: function (id, fields) {
        console.log("added", this, self)
        self.added(name, id, fields);
      },
      changed: function(id, fields) {
        self.changed(name, id, fields);
      },
      removed: function (id) {
        self.removed(name, id);
      }
    }

    const handle = Points.find(filter || {}).observeChanges(methods);

    self.ready();

    self.onStop(function () {
      handle.stop();
    });
  }

  const result = Meteor.publish(publishName, pointsFunction)
}


if (Meteor.isClient) {
  Points = new Meteor.Collection(name)
  Meteor.subscribe(name)
  window.Points = Points
}


export default Points


// METHODS // METHODS // METHODS // METHODS // METHODS // METHODS //

// Provide a different colour for each users pointer. Colours will be
// maintained across sessions, but reset when the server is rebooteed.
// TODO: Move this to a server-only collection.
const colours = [
  "#900"
, "#960"
, "#090"
, "#099"
, "#009"
, "#909"
// And recycle for now
, "#999"
, "#900"
, "#960"
, "#090"
, "#099"
, "#009"
, "#909"
, "#900"
, "#960"
, "#090"
, "#099"
, "#009"
, "#909"
]

const group_colours = {}

const getColour = (id, group_id) => {
  // Use the same pointer colour from one session to the next
  // console.log("Current:", group_colours[group_id])
  const usedColours = group_colours[group_id]
                   || (group_colours[group_id] = {})
  console.log("Used:", group_colours[group_id], usedColours)

  const usedValues = Object.keys(usedColours).map(id => (
    usedColours[id]
  ))
  // console.log("Values:", usedValues, usedColours[id])
  const colour = usedColours[id]
              || (usedColours[id] = getUnused(colours, usedValues))
  // console.log(colour)
  // console.log(group_colours)

  return colour
}


const validate = (pointData) => {
  new SimpleSchema({
    id:       { type: String }
  , group_id: { type: String }
  , x:        { type: Number }
  , y:        { type: Number }
  , active:   { type: Boolean }
  , touch:    { optional: true, type: Object, blackbox: true }
  , 
  }).validate(pointData)

  if (pointData.touch){
    new SimpleSchema({
      radiusX:       { type: Number }
    , radiusY:       { type: Number }
    , rotationAngle: { type: Number }
    }).validate(pointData.touch)
  }
}


export const pointInsert = {
  name: 'vdvoyom.pointInsert'

, run(pointInsertData) {
    console.log('vdvoyom.pointInsert', arguments)
    const { id, group_id } = pointInsertData

    if (Meteor.isServer) {
      pointInsertData.colour = getColour(id, group_id)
    }

    console.log("Insert", Meteor.isServer, pointInsertData)

    Points.upsert({ id, group_id }, pointInsertData)
  }

, call(pointInsertData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    // if (Meteor.isServer) {
      Meteor.apply(this.name, [pointInsertData], options, callback)
    // }
  }
}



export const pointUpdate = {
  name: 'vdvoyom.pointUpdate'

, run(pointUpdateData) {
      // console.log('vdvoyom.pointUpdate', arguments)

    const { id, group_id } = pointUpdateData
    const query = { id, group_id }
    const set   = { $set: pointUpdateData } // colour won't change
    Points.update(query, set)
  }

, call(pointUpdateData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [pointUpdateData], options, callback)
  }
}


// To register a new method with Meteor's DDP system, add it here
const methods = [
  pointInsert
, pointUpdate
]

methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      validate(args)
      return method.run.call(this, args)
    }
  })
})
