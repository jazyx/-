/**
 * /imports/api/teacher.js
 *
 * A singleton instance of the Teacher class is created by the App
 * component. This happens even when the user is not a teacher, in
 * which case the variable that holds the instance is cleared. The App
 * component shares its public `setView` method with the Teacher
 * instance.
 *
 * When a teacher launches the app, and the app first shows the
 * Teach component, this singleton instance is initialized and the
 * teacher's device is added to the Teachers document's loggedIn
 * field. Subsequent visits to the Teach view will have no effect;
 * there won't be multiple loggedIn records for this device.
 *
 * When the user chooses a group in the Teach view, the `join` method
 * is called. This adds the Teachers device code to the Groups
 * loggedIn field, and sets up a temporary Tracker to detect if
 * Group is deactivated. If this happens, the Teachers device code is
 * removed from the Groups loggedIn field, and the App is told to
 * navigate back to the Teach view.
 *
 * Logging the teacher out is handled without any reference to this
 * singleton instance.
 */


import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'

import { Groups } from './collections'
import { Session } from 'meteor/session'

import { logInTeacher
       , toggleActivation
       } from './methods/methods'



class Teacher {
  constructor() {
    this.trackGroup = this.trackGroup.bind(this)
  }


  setAppView() {
    console.log("Teacher.setAppView(){} should be replaced by App")
  }


  setViewFunction(setAppView) {
    this.setAppView = setAppView
  }


  initialize() {
    const id     = this.id     = Session.get("teacher_id")
    const d_code = this.d_code = Session.get("d_code")

    logInTeacher.call({ id, d_code })
  }


  // CALLS FROM <Teach /> COMPONENT

  restore() {
    if (!this.id) {
      this.initialize()
    }
  }


  join(group) {
    const { _id, view } = group

    this.group_id = _id
    Session.set("group_id", _id)

    this.setAppView(view)
    const active = this.active = true

    toggleActivation.call({
      _id
    , active
    , d_code: this.d_code
    })

    Tracker.autorun(this.trackGroup)
  }


  // REACTIVE SUBSCRIPTION to this Groups .active field

  trackGroup(tracker) {
    const select  = { _id: this.group_id }
    const project = { fields: { active: 1 } }
    const { active } = Groups.findOne(select, project)
                    || { active: false }
    if (!active) {
      tracker.stop()
      this.leaveGroup()
      this.setAppView("Teach")
    }
  }


  leaveGroup() {
    toggleActivation.call({
      _id:    this.group_id
    , active: false
    , d_code: this.d_code
    })
  }
}


export const teacher = new Teacher()