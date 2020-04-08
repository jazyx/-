import React, { Component } from 'react';
import { Session } from 'meteor/session'
import SimpleSchema from 'simpl-schema';

import collections from '../api/collections'



/**
 * { constant_description }
 *
 * Expects data with the format...
 * 
 *    { native, username, teacher, language }
 *    
 * ... where all the values are strings
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
    const _id = Users.insert(noviceData)
    // console.log("createNovice inserted doc with _id", _id)

    if (Session) { // only on client
      Session.set("user_id", _id)
    }
  }

  // Call Method by referencing the JS object (4)
  // Also, this lets us specify Meteor.apply options once in
  // the Method implementation, rather than requiring the caller
  // to specify it at the call site.
, call(noviceData, callback) {
    const options = {
      returnStubValue: true,     // (5)
      throwStubExceptions: true  // (6)
    }

    Meteor.apply(this.name, [noviceData], options, callback)
  }
}

// Register the method with Meteor's DDP system
Meteor.methods({
  [createNovice.name]: function (args) {
    createNovice.validate.call(this, args);
    createNovice.run.call(this, args);
  }
})