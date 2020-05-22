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
    , view_data: { type: Object, blackbox: true }
    }).validate(setViewData)

    new SimpleSchema({
      "3":    { type: Object, blackbox: true }
    , "4":    { type: Object, blackbox: true }
    , "6":    { type: Object, blackbox: true }
    , "show": { type: Object, blackbox: true }
    }).validate(setViewData.view_data)
  }

, run(setViewData) {
    const { group_id: _id, view_data } = setViewData
    const select = { _id }
    const set = { $set: { view_data } }
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
    const set = { $set: { ["view_data.show."+hint]: true } }
    Groups.update(select, set)
  }
}


export const setDragTarget = {
  name: "drag.setDragTarget"

, call(dragTargetData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [dragTargetData], options, callback)
  }

, validate(dragTargetData) {
    new SimpleSchema({
      drag_id:  { type: String } // id of HTML element
    , pilot:    { type: String } // d_code for user|teacher's device
    , group_id: { type: String }
    , x:        { type: Number }
    , y:        { type: Number }
    }).validate(dragTargetData)
  }

  /* Call will throw an error if any user (including pilot) started an
   * action but did not complete it.
   * TODO: Ensure that all pilot actions are removed when the pilot
   * logs out.
   */

, run(dragTargetData) {
    const { group_id: _id, pilot, drag_id, x, y } = dragTargetData
    const select = { _id }
    const project = { fields: { "view_data.pilot": 1 } }

    const { view_data } = Groups.findOne(select, project)
                       || { view_data: {} } // if group has no
    if (view_data.pilot) {
      // There is already an operation in progress
      throw ("Group " + group_id + " locked by a process from " + view_data.pilot)
    }

    const set = {
      $set: {
        "view_data.pilot":   pilot
      , "view_data.drag_id": drag_id
      , "view_data.x":       x
      , "view_data.y":       y
      }
    , $unset: {
        "view_data.drop": 0
      }
    }
    return Groups.update(select, set)
  }
}


export const updateDragTarget = {
  name: "drag.updateDragTarget"

, call(dragTargetData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [dragTargetData], options, callback)
  }

, validate(dragTargetData) {
    new SimpleSchema({
      group_id: { type: String }
    , pilot:    { type: String }
    , x:        { type: Number }
    , y:        { type: Number }
    }).validate(dragTargetData)
  }

, run(dragTargetData) {
    const { group_id: _id, pilot, x, y } = dragTargetData
    const select = { _id, "view_data.pilot": pilot }
    const set = {
      $set: {
        "view_data.x": x
      , "view_data.y": y
      }
    }
    return Groups.update(select, set)
  }
}


export const dropDragTarget = {
  name: "drag.dropDragTarget"

, call(dropTargetData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [dropTargetData], options, callback)
  }

, validate(dropTargetData) {
    new SimpleSchema({
      group_id: { type: String }
    }).validate(dropTargetData)
  }

, run(dropTargetData) {
    const { group_id: _id } = dropTargetData
    const select = { _id }
    const unset = {
      $unset: {
        "view_data.pilot":   0
      , "view_data.drag_id": 0
      , "view_data.x":       0
      , "view_data.y":       0
      }
    }
    return Groups.update(select, unset)
  }
}


const methods = [
  setViewData
, toggleShow
, setDragTarget
, updateDragTarget
, dropDragTarget
]


methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      method.validate.call(this, args)
      return method.run.call(this, args)
    }
  })
})


// if (Meteor.isClient) {
//   window.setDragTarget = setDragTarget
//   window.updateDragTarget = dropDragTarget
//   window.dropDragTarget = dropDragTarget
// }