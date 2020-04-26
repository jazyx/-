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

import LogIn from './login'
import LogOut from './logout'
import JoinGroup from './join'
import LeaveGroup from './leave'
import CreateAccount from './account'
// ^^^ import required collections by name in associated class scripts

// // SUBSCRIPTION IS TAKEN CARE OF IN Share.jsx ON THE CLIENT // //
// if (Meteor.isClient) {
//   for (let name in collections) {
//     Meteor.subscribe(collections[name]._name) //, "methods")
//   }
// }


/** Creates or updates User and Group records for after profiling
 *  Calling the method a second time reuses the existing groups
 */
export const createAccount = {
  name: 'vdvoyom.createAccount'

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
    new JoinGroup(accountData)

    // console.log("Data to return from CreateAccount", accountData)

    return accountData
  }

, call(accountData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [accountData], options, callback)
  }
}



/** Logs a user's device into its Groups and Users records
 *
 *  Creates a new account if necessary, or asks for confirmation by
 *  PIN number if ownership of a name is uncertain
 */
export const logIn = {
  name: 'vdvoyom.logIn'

, validate(logInData) {
    new SimpleSchema({
      username: { type: String }
    , native:   { type: String }
    , teacher:  { type: String }
    , language: { type: String }
    , d_code:   { type: String }
    , q_code:   { type: String, optional: true }
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

    // May not be useful on Client, so not available
    , q_index:  { type: Number, optional: true }
    , q_color:  { type: String, optional: true }
    }).validate(logInData)
  }

, run(logInData) {
    new LogIn(logInData)

    const { status } = logInData

    switch (status) {
      case "CreateAccount":
        createAccount.run(logInData) // logInData modified
        return logInData

      case "loggedIn":
        new JoinGroup(logInData) // fall through; action: loggedIn
      case "RequestPIN":
        return logInData

      default:
        throw "Unknown action in vdvoyom.logIn: '" + action + "'"
    }
  }

, call(logInData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [logInData], options, callback)
  }
}



/** Logs a user's device out of its Groups and Users records
 *
 *
 */
export const logOut = {
  name: 'vdvoyom.log'

, validate(logOutData) {
    new SimpleSchema({
      id:       { type: String }
      // < 5 chars = teacher; > 5 chars = user
      // 'xxxx' => 456976 combinations
    , group_id: { type: String }
    , d_code:   { type: String }
    }).validate(logOutData)
  }

, run(logOutData) {
    new LeaveGroup(logOutData) // adds .leftGroup = [<id>, ...]
    new LogOut(logOutData)

    return logOutData
  }

, call(logOutData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [logOutData], options, callback)
  }
}



/** Allows the master to share viewSize with slaves
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



// To register a new method with Meteor's DDP system, add it here
const methods = [
  createAccount
, logIn
, logOut
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