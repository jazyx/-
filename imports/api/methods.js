/**
 * methods.js
 *
 * Based on:
 *
 *   https://guide.meteor.com/methods.html#advanced-boilerplate
 */

import { Meteor } from 'meteor/meteor'
import { Session } from 'meteor/session'
import SimpleSchema from 'simpl-schema'

import collections from '../api/collections'

if (Meteor.isClient) {
  for (let name in collections) {
    Meteor.subscribe(collections[name]._name)
  }
}



/**
 * Expects data with the format...
 *
 *    { native, username, teacher, language }
 *
 * ... where all the values are strings. Throws an error if this is
 * not the case.
 */
export const createNovice = {
  name: 'vdvoyom.createNovice'

  // Factor out validation so that it can be run independently
  // Will throw an error if any of the arguments are invalid
, validate(noviceData) {
    new SimpleSchema({
      username: { type: String }
    , native:   { type: String }
    , teacher:  { type: String }
    , language: { type: String }
    }).validate(noviceData)
  }

  // Factor out Method body so that it can be called independently
, run(noviceData) {
    const Users = collections["Users"]
    // TODO: 
    // Allow more than one user with a given name and native language
    const { native, username } = noviceData

    let existing = Users.findOne({ native, username })
    const user_id  = existing
                   ? existing._id
                   : Users.insert(noviceData)

    // Find a group with this learner and this teacher
    const Groups = collections["Groups"]
    const group = {
      learner_ids: { $elemMatch: { $eq: user_id } }
    , teacher_id: noviceData.teacher
    }

    let group_id
    existing = Groups.findOne(group)
    if (existing) {
      group_id = existing._id

    } else {
      group.learner_ids = [ user_id ]
      group_id = Groups.insert(group)
    }

    if (Session) { // Meteor.isClient)
      Session.set("user_id", user_id)
      Session.set("group_id", group_id)
    }
  }

  // Call Method by referencing the JS object
  // Also, this lets us specify Meteor.apply options once in the
  // Method implementation, rather than requiring the caller to
  // specify it at the call site.
, call(noviceData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [noviceData], options, callback)
  }
}



/**
 * Expects data with the format...
 *
 *    { id: <string> }
 */
export const log = {
  name: 'vdvoyom.log'

, validate(logData) {
    new SimpleSchema({
      id: { type: String }
    , in: { type: Boolean }
    }).validate(logData)
  }

, run(logData) {
    const [ id, _id ] = [ logData.id, logData.id ]
    const isTeacher   = id.length < 5 // teacher.ids "xxxx" max
    const loggedIn    = logData.in
    const set         = { $set: { loggedIn } }

    console.log(`Logging ${loggedIn ? "in" : "out"} ${isTeacher ? "teacher" : "learner"} ${id}`)

    if (isTeacher) {
      collections["Teachers"].update( { id }, set )

    } else {
      collections["Users"].update( { _id }, set )
    }
  }

, call(logData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [logData], options, callback)
  }
}



// Register the method with Meteor's DDP system
Meteor.methods({
  [createNovice.name]: function (args) {
    createNovice.validate.call(this, args);
    createNovice.run.call(this, args);
  }
, [log.name]: function (args) {
    log.validate.call(this, args);
    log.run.call(this, args);
  }
})
