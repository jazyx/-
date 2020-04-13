/**
 * methods.js
 *
 * Based on...
 *   https://guide.meteor.com/methods.html#advanced-boilerplate
 * ... with the important addition of a `return` statement in each
 * entry for Meteor.methods()
 *
 * createNovice() is called from the Submit view after the user has
 *   selected a native language, a username and a teacher. It creates
 *   a User record and a Groups record with the chosen teacher, and
 *   indicates a loggedIn status in both.
 *
 *   User:  { $set: { loggedIn: true } }
 *   Group: { $push { loggedIn: user_id } }
 *
 *   If it is called more than once with the same username and native
 *   language/teacher, the  existing records are used. If the user
 *   changes language or teacher, a new User record or a new Groups
 *   record will be created.
 *
 *   NOTE: one teacher who works with two different languages will
 *   have two different teacher ids
 *
 * log() combines login and logout
 *   Called from Teach (constructor => logTeacherIn) and Menu
 *   (beforeunload => logOut)
 *
 *   When anyone logs in, the loggedIn status of their profile record
 *   (Teacher or User) is set to true
 *   When anyone logs out, their loggedIn status is set to false and
 *   their loggedOut status is set to an ISODate, so that we can
 *   calculated how long ago they were last seen
 *   When users log in or out, their id is push to or pulled from
 *   the loggedIn array of all the groups they belong to
 *   When teachers log out, the active state of their current group
 *   is set to false.
 *
 * reGroup() combines join group and leave group
 *   Called for users from the Connect view
 *
 */

import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'

import collections from '../api/collections'

if (Meteor.isClient) {
  for (let name in collections) {
    Meteor.subscribe(collections[name]._name)
  }
}



/** Creates or updates User and Group records for after profiling
 *  Calling the method a second time reuses the existing groups
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

    return { user_id, group_id }
  }

  /** Call Method by referencing the JS object
   *  Also, this lets us specify Meteor.apply options once in the
   *  Method implementation, rather than requiring the caller to
   *  specify it at the call site
   */
, call(noviceData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [noviceData], options, callback)
  }
}



/** Logs users and teachers in and out
 * 
 *  Groups, Users and Teachers are updated.
 */
export const log = {
  name: 'vdvoyom.log'

, validate(logData) {
    new SimpleSchema({
      id: { type: String }  // < 5 chars = teacher; > 5 chars = user
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

    // console.log(`Logging ${loggedIn ? "in" : "out"} ${isTeacher ? "teacher" : "learner"} ${id}`)

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



/** Allows users to join and leave groups
 */
export const reGroup = {
  name: 'vdvoyom.reGroup'

, validate(reGroupData) {
    new SimpleSchema({
      teacher_id: { type: String }
    , user_id:    { type: String }
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
    collections["Groups"].update(query, set, multi)

    const groups = collections["Groups"].find(query).fetch()

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



/** Allows users to join and leave groups
 */
export const share = {
  name: 'vdvoyom.share'

, validate(shareData) {
    new SimpleSchema({
      _id:  { type: String }
    , key:  { type: String }
    , data: { type: Object, blackbox: true }
    }).validate(shareData)
  }

, run(shareData) {
    const { _id, key, data } = shareData
    const query = { _id }
    const set   = { $set: { [key]: data } }
    collections["Groups"].update(query, set)

    // console.log( shareData, JSON.stringify(query), JSON.stringify(set))
  }

, call(shareData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [shareData], options, callback)
  }
}



/** Called by Activity.goActivity()
 */
export const setActivity = {
  name: 'vdvoyom.setActivity'

, validate(setActivityData) {
    new SimpleSchema({   
      activity: { type: String }
    , group_id: { type: String }
    }).validate(setActivityData)
  }

, run(setActivityData) {
    const { group_id: _id, activity } = setActivityData
    const query = { _id }
    const set   = { $set: { activity } }
    collections["Groups"].update(query, set)

    // console.log(
    //   'db.groups.update('
    // + JSON.stringify(query)
    // + ", "
    // + JSON.stringify(set))
    // + ")"
    // // , setActivityData
  }

, call(setActivityData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [setActivityData], options, callback)
  }
}



// To register a new method with Meteor's DDP system, add it here
const methods = [
  createNovice
, log
, reGroup
, share
, setActivity
]

methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      method.validate.call(this, args)
      return method.run.call(this, args)
    }
  })
})