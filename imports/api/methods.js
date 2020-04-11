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

    // Log in automatically
    Users.update({ _id: user_id }, { $set: { loggedIn: true } })

    // ASSUME ONE LEARNER PER GROUP, ONE GROUP PER LEARNER, FOR NOW //
    
    // Find a group with this teacher and this learner...
    const Groups = collections["Groups"]
    const group = {
      user_ids: { $elemMatch: { $eq: user_id } }
    , teacher_id: noviceData.teacher
    }

    let group_id
    existing = Groups.findOne(group)
    if (!existing) {
      // ... or create it and make this learner master
      group.user_ids = [ user_id ]
      group.master = user_id
      group.loggedIn = [ user_id ]
      group_id = Groups.insert(group)

    } else {
      // A group was found, so join it now
      const _id = group_id = existing._id
      const push = { $push: { loggedIn: user_id } }

      Groups.update({ _id }, push)
    }

    if (Session) { // Meteor.isClient)
      Session.set("user_id", user_id)
      Session.set("master",  user_id)
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

    if (!loggedIn) {
      // Remember when this user was last seen
      set.$currentDate = {
        loggedOut: true
      }

      if (isTeacher) {
        const query = { teacher_id: id, active: true }
        const disactivate  = { $set: { active: false } }
        collections["Groups"].update(query, disactivate)

      } else {
        // Log student out of any current groups
        const query = { loggedIn: { $elemMatch: { $eq: _id } } }
        const pull  = { $pull: { loggedIn: _id } }
        const multi = true 
        collections["Groups"].update(query, pull, multi)
      }
    }

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



/**
 * Expects data with the format...
 *
 *    { id: <string> }
 */
export const reGroup = {
  name: 'vdvoyom.reGroup'

, validate(reGroupData) {
    new SimpleSchema({
      teacher_id: { type: String }
    , user_id: { type: String }
    , join:       { type: Boolean }
    }).validate(reGroupData)
  }

, run(reGroupData) {
    const { teacher_id, user_id, join } = reGroupData
    const query = {
      $and: [
        { teacher_id }
      , { user_ids: { $elemMatch: { $eq: user_id }}}
      ]
    }

    const set   = join
                ? { $push: { loggedIn: user_id } }
                : { $pull: { loggedIn: user_id } }
    const multi = true 

    console.log("query:", JSON.stringify(query))
    console.log("set:", JSON.stringify(set))
    collections["Groups"].update(query, set, multi)

    const groups = collections["Groups"].find(query).fetch()

    console.log("groups:", groups)

    return groups
  }

, call(reGroupData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [reGroupData], options, callback)
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
, [reGroup.name]: function (args) {
    reGroup.validate.call(this, args);
    reGroup.run.call(this, args);
  }
})
