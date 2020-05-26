import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'
import { Groups } from '../../../api/collections'



export const setViewData = {
  name: "cloze.setViewData"

, call(setViewData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [setViewData], options, callback)
  }

, validate(setViewData) {
    new SimpleSchema({
      group_id: { type: String }
    , view_data: { type: Object, blackbox: true }
    }).validate(setViewData)

    new SimpleSchema({
      "phrase":        { type: String }
    , "src":           { type: String }
    , "input":         { type: String }
    , "requireSubmit": { type: Boolean }
    }).validate(setViewData.view_data)
  }

, run(setViewData) {
    const { group_id: _id, view_data } = setViewData
    const select = { _id }
    const set = { $set: { view_data } }
    Groups.update(select, set)

    // console.log(
    //   "db.groups.update("
    // + JSON.stringify(select)
    // + ","
    // + JSON.stringify(set)
    // + ")"
    // )
  }
}


export const updateInput = {
  name: "cloze.updateInput"

, call(inputData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [inputData], options, callback)
  }

, validate(inputData) {
    new SimpleSchema({
      group_id: { type: String }
    , input:    { type: String }
    }).validate(inputData)
  }

, run(inputData) {
    const { group_id: _id, input } = inputData
    const select = { _id }
    const set = { $set: { "view_data.input": input } }
    Groups.update(select, set)

    // console.log(
    //   "db.groups.update("
    // + JSON.stringify(select)
    // + ","
    // + JSON.stringify(set)
    // + ")"
    // )
  }
}


const methods = [
  setViewData
, updateInput
]


methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      method.validate.call(this, args)
      return method.run.call(this, args)
    }
  })
})