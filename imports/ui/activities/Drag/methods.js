import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'
import { Groups } from '../../../api/collections'



export const setViewData = {
  name: "drag.setViewData"

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
    , viewData: { type: Object, blackbox: true }
    }).validate(setViewData)

    new SimpleSchema({
      "3":    { type: Object, blackbox: true }
    , "4":    { type: Object, blackbox: true }
    , "6":    { type: Object, blackbox: true }
    , "show": { type: Object, blackbox: true }
    }).validate(setViewData.viewData)
  }

, run(setViewData) {
    const { group_id: _id, viewData } = setViewData
    const select = { _id }
    const set = { $set: { viewData } }
    Groups.update(select, set)
  }
}


export const toggleShow = {
  name: "drag.toggleShow"

, call(toggleShowData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [toggleShowData], options, callback)
  }

, validate(toggleShowData) {
    new SimpleSchema({
      hint:     { type: String } // d_code for user|teacher's device
    , group_id: { type: String }
    }).validate(toggleShowData)
  }

, run(toggleShowData) {
    const { group_id: _id, hint } = toggleShowData
    const select = { _id }
    const set = { $set: { ["viewData.show."+hint]: true } }
    Groups.update(select, set)
  }
}


const methods = [
  setViewData
, toggleShow
]


methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      method.validate.call(this, args)
      return method.run.call(this, args)
    }
  })
})
