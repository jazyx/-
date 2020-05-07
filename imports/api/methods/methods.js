/**
 * methods.js
 *
 * Based on...
 *   https://guide.meteor.com/methods.html#advanced-boilerplate
 * ... with the important addition of a `return` statement in each
 * entry for Meteor.methods()
 *
 * createAccount() is called from the Submit view after the user has
 *   selected a native language, a username and a teacher. It creates
 *   a User record and a Groups record with the chosen teacher, and
 *   indicates a logged_in status in both.
 *
 *   User:  { $set: { logged_in: true } }
 *   Group: { $push { logged_in: user_id } }
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
 *   When anyone logs in, the logged_in status of their profile record
 *   (Teacher or User) is set to true
 *   When anyone logs out, their logged_in status is set to false and
 *   their loggedOut status is set to an ISODate, so that we can
 *   calculated how long ago they were last seen
 *   When users log in or out, their id is push to or pulled from
 *   the logged_in array of all the groups they belong to
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

import LogIn from './login'
import LogOut from './logout'
import JoinGroup from './join'
import LeaveGroup from './leave'
import CreateGroup from './group'
import LogInTeacher from './loginTeacher'
import CreateAccount from './account'
import ToggleActivation from './activate'


import { Groups } from '../collections' // used by share & setView

// // SUBSCRIPTION IS TAKEN CARE OF IN Share.jsx ON THE CLIENT // //
// if (Meteor.isClient) {
//   for (let name in collections) {
//     Meteor.subscribe(collections[name]._name) //, "methods")
//   }
// }


/** Creates or updates a User record after profiling
 *  Calling the method a second time reuses the existing records
 */
export const createAccount = {
  name: 'vdvoyom.createAccount'

, call(accountData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [accountData], options, callback)
  }

, validate(accountData) {
    new SimpleSchema({
      username: { type: String }
    , native:   { type: String }
    , teacher:  { type: String }
    , language: { type: String }
    , d_code:   { type: String }

    // action will have been added if the original call was to logIn
    , action:   { type: String, optional: true }
    }).validate(accountData)
  }

, run(accountData) {
    new CreateAccount(accountData) // modifies accountData

    // console.log("After CreateAccount accountData is", accountData)

    new LogIn(accountData)     // , action: "loggedIn"

    // console.log("Data to return from CreateAccount", accountData)

    return accountData
  }
}



/** Creates or updates a Group record with a teacher after profiling
 *  Calling the method a second time reuses the existing group
 */
export const createGroup = {
  name: 'vdvoyom.createGroup'

, call(accountData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [accountData], options, callback)
  }

, validate(accountData) {
    new SimpleSchema({
      user_id: { type: String }
    , teacher:  { type: String }
    , language: { type: String }

    // Other properties may exist but will not be used
    , username: { type: String, optional: true }
    , native:   { type: String, optional: true }
    , d_code:   { type: String, optional: true }
    , action:   { type: String, optional: true }
    }).validate(accountData)
  }

, run(accountData) {
    new CreateGroup(accountData) // modifies accountData
    new JoinGroup(accountData)   // action 

    return accountData
  }
}



/** Logs a user's device into its Groups and Users records
 *
 *  Creates a new account if necessary, or asks for confirmation by
 *  PIN number if ownership of a name is uncertain
 */
export const logIn = {
  name: 'vdvoyom.logIn'

, call(logInData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [logInData], options, callback)
  }

, validate(logInData) {
    new SimpleSchema({
      username: { type: String }
    , d_code:   { type: String }

    , restore_all: { type: Boolean, optional: true }

    // Sent only if automatic login is NOT used
    , native:   { type: String, optional: true } // for Users doc
    , teacher:  { type: String, optional: true } // for Groups doc
    , language: { type: String, optional: true } //      —⫵—

    , q_code:   { type: String, optional: true } // created on server
    // if q_code is missing or does not match username, Client may be
    // asked to provide a PIN, and then logIn will be called again.
    // In that case, status will be set to "RequestPIN" which may be
    // altered to "CreateAccount" if user has no PIN, and pin_given
    // will be set to true
    , pin_given:{ type: Boolean, optional: true }
    , status :  { type: String, optional: true }

    // Sent only if localStorage is available on Client
    , user_id:  { type: String, optional: true }
    , group_id: { type: String, optional: true }
    , q_color:  { type: String, optional: true }

    // May not be useful on Client, so not available
    , q_index:  { type: Number, optional: true }
    }).validate(logInData)
  }

, run(logInData) {
    new LogIn(logInData)

    let { status } = logInData

    switch (status) {
      // New user
      case "CreateAccount":
        createAccount.run(logInData) // fall through to createGroup
      case "CreateGroup":
        createGroup.run(logInData)   // logInData modified
        return logInData

      // Existing user, perhaps with a new teacher
      case "loggedIn":
        new JoinGroup(logInData) // fall through; action: loggedIn
        if (logInData.status === "CreateGroup") {
          createGroup.run(logInData)
        }

      // Name that matches an existing user, but invalid q_code
      case "RequestPIN":
        return logInData

      default:
        throw "Unknown action in vdvoyom.logIn: '" + action + "'"
    }
  }
}



/** Logs a teacher's device into its Groups and Users records
 *
 *  A
 */
export const logInTeacher = {
  name: 'vdvoyom.logInTeacher'

, call(logInData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [logInData], options, callback)
  }

, validate(logInData) {
    new SimpleSchema({
      id:       { type: String }
    , d_code:   { type: String }
    }).validate(logInData)
  }

, run(logInData) {
    new LogInTeacher(logInData)
    return logInData
  }
}



/** Logs a teacher's device into its Groups and Users records
 *
 *  A
 */
export const toggleActivation = {
  name: 'vdvoyom.toggleActivation'

, call(groupData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [groupData], options, callback)
  }

, validate(groupData) {
    new SimpleSchema({
      _id:    { type: String }
    , d_code: { type: String }
    , active: { type: Boolean }
    }).validate(groupData)
  }

, run(groupData) {
    new ToggleActivation(groupData)
    return groupData
  }
}



/** Logs a user's device out of its Groups and Users records
 *
 *
 */
export const logOut = {
  name: 'vdvoyom.log'

, call(logOutData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [logOutData], options, callback)
  }

, validate(logOutData) {
    new SimpleSchema({
      id:       { type: String }
      // < 5 chars = teacher; > 5 chars = user
      // 'xxxx' => 456976 combinations
    , d_code:   { type: String }
      // A Teacher might log out without being part of a group
    , group_id: { type: String, optional: true }
    }).validate(logOutData)
  }

, run(logOutData) {
    new LeaveGroup(logOutData) // adds .leftGroup = [<id>, ...]
    new LogOut(logOutData)

    return logOutData
  }
}



/** Allows the master to share view_size with slaves
 */
export const share = {
  name: 'vdvoyom.share'

, call(shareData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [shareData], options, callback)
  }

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
    const select = { _id }
    const set    = { $set: { [key]: data } }
    Groups.update(select, set)

    // console.log( shareData, JSON.stringify(select), JSON.stringify(set))
  }
}



/** Called by Activity.goActivity()
 */
export const setView = {
  name: 'vdvoyom.setView'

, call(setViewData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [setViewData], options, callback)
  }

, validate(setViewData) {
    new SimpleSchema({
      view:     { type: String }
    , group_id: { type: String }
    }).validate(setViewData)
  }

, run(setViewData) {
    const { group_id: _id, view } = setViewData
    const select = { _id }
    const set    = { $set: { view } }
    Groups.update(select, set)

    // console.log(
    //   'db.groups.update('
    // + JSON.stringify(select)
    // + ", "
    // + JSON.stringify(set)
    // + ")"
    // // , setViewData
    // )
  }
}



// To register a new method with Meteor's DDP system, add it here
const methods = [
  createAccount
, createGroup
, logIn
, logOut
, logInTeacher
, toggleActivation
, share
, setView
]

methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      method.validate.call(this, args)
      return method.run.call(this, args)
    }
  })
})