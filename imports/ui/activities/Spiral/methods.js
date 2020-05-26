import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'
import { Groups } from '../../../api/collections'



export const setStart = {
  name: 'spiral.setStart'

, call(setStartData, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [setStartData], options, callback)
  }

, validate(setStartData) {
    new SimpleSchema({
      group_id: { type: String }
    , start:    { type: Number }
    }).validate(setStartData)
  }

, run(setStartData) {
    const { group_id: _id, start } = setStartData
    const select = { _id }
    const set    = { $set: { "view_data.start": start } }
    Groups.update(select, set)
  }
}



// To register a new method with Meteor's DDP system, add it here
const methods = [
  setStart
]

methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      method.validate.call(this, args)
      return method.run.call(this, args)
    }
  })
})