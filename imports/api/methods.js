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
 * NOTE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
 * Methods specific to the Points collection are defined separately in
 * /imports/api/points.js
 * <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
 *
 */

import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'

import collections from '../api/collections'

if (Meteor.isClient) {
  for (let name in collections) {
    Meteor.subscribe(collections[name]._name) //, "methods")
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
    , d:    { type: String }
    , q_code:   { type: String, optional: true}
    }).validate(noviceData)
  }

  // Factor out Method body so that it can be called independently

, run(noviceData) {
    const Users = collections["Users"]

    function getUsersNamed({ username, teacher }) {
      const query = { teacher_id: teacher, username }
      const users = Users.find(query).count()

      return users
    }

    function createNewAccount() {

    }

    function getQData () {
      // Create a number at random between 0833 and 9165 (one of 8333
      // possible numbers). Ensure that it has not been attributed to
      // anyone else with the same name or teacher.
    }

    // TODO:
    // Allow more than one user with a given name and native language
    // Using color q_code * 711/256
    const { native, username, teacher, d_code, q_code } = noviceData
    delete noviceData.d_code

    const existing = getUsersNamed(noviceData)
    switch (existing) {
      case 0:
        // A user is connecting with this teacher for the first time
        const user_id = createNewAccount(data, noviceData)
      break
      default:
        // This may be a new user with the same name as an existing
        // user, or it may be a returning user connecting from a new
        // device or from a device which has no localStorage
        return askForPINCode(data)
    } 
    

    // ASSUME ONE LEARNER PER GROUP, ONE GROUP PER LEARNER, FOR NOW //

    // Find a group with this teacher and this learner...
    const Groups = collections["Groups"]
    const group = {
      user_ids: { $elemMatch: { $eq: user_id } }
    , teacher_id: noviceData.teacher
    }
    const view = "Activity"

    let group_id
    existing = Groups.findOne(group)
    if (!existing) {
      // ... or create it and make this learner master
      group.user_ids = [ user_id ]
      group.master = user_id
      group.loggedIn = [ user_id ]
      group.view = view
      group_id = Groups.insert(group)

    } else {
      // A group was found, so join it now

      Groups.update({ _id }, updates )
    }

    return { user_id, group_id, view }
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
    , d_code: { type: String }
    , teacher: { type: String, optional: true}
    }).validate(logData)
  }

, run(logData) {
    const { user_id, teacher, d_code } = logData
    const Teachers  = collections["Teachers"]
    const Users     = collections["Users"]
    const Groups    = collections["Groups"]

    const isTeacher = id.length < 6 // teacher.ids "xxxxx" max
    const loggingIn = logData.in

    let collection
      , query
      , project

    function logOut() {
      // Get current dqueue, to check if d_code is first in the queue
      // The device should be used in only one group.
      collection
      query    = { dqueue: { $elemMatch: { $eq: d_code } } }
      project  = { fields: { dqueue: 1 } }
      const { _id, dqueue } = Groups.findOne(query)

      // // Do we need to the following line? Or will the Points
      // // component work this out for itself?
      // const isMaster = !dqueue.indexOf(d_code)

      // Remove this device from this group...
      Groups.updateOne({ _id }, { $pull: { dqueue: d_code } } )

      // ... and from the User/Teacher record
      if (isTeacher) {
        collection = Teachers
        query = { id }
      } else {
        collection = Users
        query = { _id: id }
      }

      collection.updateOne(query, { $pull: { loggedIn: d_code } } )

      // Get all the remaining devices for this user/teacher
      project = { _id: 0, loggedIn: 1 }
      const { loggedIn } = collection.findOne( query, project )

      if (!loggedIn.length) {
        // This user had only one device, and this was it. They're
        // gone. Remember when they were last seen.
        collection.updateOne(query, {$currentDate: {loggedOut: true}})

      } else {
        // This user /teacher has other devices loggedIn. Check if
        // this is only one here
        const noOtherViewsHere = loggedIn.every(d_code => (
          dqueue.indexOf(d_code) < 0
        ))

        if (noOtherViewsHere) {
          // Remove user_id from loggedIn
          Groups.updateOne({ _id }, { $pull: { loggedIn: id } } )

        } else {
          // This user is still part of this group, on another device
          // We've removed a different device. Don't do anything else.
        }
      }
    }

    function logIn() {     
      // Logging in
      if (isTeacher) {
        collection = Teachers
        query = { id }
      } else {
        collection = Users
        query = { _id: id, teacher }
      }

      // Record that this user/teacher loggedIn with this device
      collection.updateOne(query, { loggedIn: d_code })

      const { _id } = Groups.findOne({ })
      const push = { $push: { loggedIn: _id, dqueue: d_code } }
      Groups.updateOne(query, push)

      // Get the most recent view for the teacher-student group
      const project = { _id: 0, view: 1 }
      var { view } = Groups(query, project).findOne()

      return { view }
    }

    if (!loggingIn) {
      logOut()

    } else {
      return logIn()
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



// /** Allows users to join and leave groups
//  */
// export const reGroup = {
//   name: 'vdvoyom.reGroup'

// , validate(reGroupData) {
//     new SimpleSchema({
//       teacher_id: { type: String }
//     , user_id:    { type: String }
//     , join:       { type: Boolean }
//     }).validate(reGroupData)
//   }

// , run(reGroupData) {
//     const { teacher_id, user_id, join } = reGroupData
//     const query = {
//       $and: [
//         { teacher_id }
//       , { user_ids: { $elemMatch: { $eq: user_id }}}
//       ]
//     }

//     // Pull will remove all occurrences of the user_id, just in case
//     // multiple pushes occurred.
//     const set = join
//               ? { $push: { loggedIn: user_id } }
//               : { $pull: { loggedIn: user_id } }
//     const multi = true
//     collections["Groups"].update(query, set, multi)

//     const groups = collections["Groups"].find(query).fetch()

//     return groups
//   }

// , call(reGroupData, callback) {
//     const options = {
//       returnStubValue: true
//     , throwStubExceptions: true
//     }

//     Meteor.apply(this.name, [reGroupData], options, callback)
//   }
// }



/** Allows users to join and leave groups
 */
export const share = {
  name: 'vdvoyom.share'

, validate(shareData) {
    new SimpleSchema({
      _id:  { type: String }
    , key:  { type: String }
    , data: SimpleSchema.oneOf(
        { type: String }
      , { type: Object, blackbox: true }
      )
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
export const setView = {
  name: 'vdvoyom.setView'

, validate(setViewData) {
    new SimpleSchema({
      view:     { type: String }
    , group_id: { type: String }
    }).validate(setViewData)
  }

, run(setViewData) {
    const { group_id: _id, view } = setViewData
    const query = { _id }
    const set   = { $set: { view } }
    collections["Groups"].update(query, set)

    // console.log(
    //   'db.groups.update('
    // + JSON.stringify(query)
    // + ", "
    // + JSON.stringify(set)
    // + ")"
    // // , setViewData
    // )
  }

, call(setViewData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [setViewData], options, callback)
  }
}




/** Called by Activity.goActivity()
 */
export const test = {
  name: 'vdvoyom.test'

, validate() {
    console.log("Validating")
  }

, run() {
    const result = 123 //self.subRoutine()
    // console.log("test subRoutine ran:", result )
    return { result }
  }

, subRoutine() {
    console.log("running subRoutine")
    return "successfully"
  }

, call(testData, callback) {
    // This code is only run on the Client, so `this` only refers to
    // the enclosing object on the Client. On the server, only
    // validate() and run() are called, separately. As a result
    // this.subRoutine is inaccessible and cannot be called.
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [], options, callback)
  }
}






// To register a new method with Meteor's DDP system, add it here
const methods = [
  createNovice
, log
// , reGroup
, share
, setView
, test
]

methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      // console.log("this:", this)
      method.validate.call(this, args)
      return method.run.call(this, args)
    }
  })
})