/**
 * imports/ui/Share.jsx
 * 
 * The Share component provides a wrapper div for the whole interface.
 * Users who are teachers will, by design, join each group as a slave
 * so that their student can use their entire screen estate.
 * 
 * In one-on-one sessions, the student will always be master. In 
 * group lessons, only one student will be master. There will always
 * be a master in every group. In a many-student group, a master will
 * be chosen from those logged on when the teacher starts the group.
 * If that student leaves, mastery will be transferred to another 
 * student, or the group will be disolved. If a student changes groups
 * their status as master may change.
 * 
 * This script is designed to share the view dimensions of the 
 * device which is master. This may happen in three ways:
 * 
 * 1. When the master first arrives
 * 2. If the master changes (the user may stop being master)
 * 3. If the current master alters the size of their browser window
 *    or flips orientation on their phone or tablet.
 */

import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { Tracker } from 'meteor/tracker'
import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { Groups } from '../api/collections'
import { share } from '../api/methods'

Meteor.subscribe(Groups._name)


const getViewSize = () => {
  const { width, height } = document.body.getBoundingClientRect()
  return { width, height }
}



class Share extends Component {
  constructor(props) {
    super(props)

    this.setViewSize = this.setViewSize.bind(this)
    this.setMaster   = this.setMaster.bind(this)
    this.getMaster   = this.getMaster.bind(this)

    // When the local window is resized one of two things should
    // happen:
    // 1. If this device is master, it should tell all the slave
    //    devices to update their display
    // 2. If this device is a slave, it should resise the master's
    //    view to fit optimally in the current view area
    window.addEventListener("resize", this.setViewSize, false)

    // When the master changes, one of two things should happen:
    // 1. If this user becomes master, this device should update the
    //    viewSize for the group
    // 2. If this user stops being master, this device should stop 
    //    telling slaves to update if the view size changes
    // 0. If the master moves from one remote device to another,
    //    nothing needs to be done.
    this.master = ""
    this.isMaster = true // until otherwise proven
    this.masterDependency = new Tracker.Dependency
    this.trackMaster = Tracker.autorun(() => this.setViewSize)
    
    // Initialize the view according to the current knowledge of who
    // is master
    this.setViewSize()
  }


  setMaster(master) {
    if (this.master === master) {
      // The master hasn't changed
      return
    }

    this.master = master
    const nowMaster = [this.master,master].indexOf(this.props.user_id)
    // -1 : still not master
    //  0 : was master but is no longer
    //  1 : has just become master
    
    if (nowMaster < 0) {
      // The master status of this user has not changed
      return
    }

    this.isMaster = !!nowMaster
    this.masterDependency.changed()
  }


  getMaster() {
    this.masterDependency.depend()
    return this.master
  }


  setViewSize() {
    // Before user has logged in, Session will be empty, 
    // this.props.viewSize will be (by default) the local body size
    // and this.isMaster will be true (even for teachers)
    const data     = getViewSize()
    const viewSize = this.isMaster
                   ? data
                   : this.props.viewSize // set by remote master
    const ratioH = data.height / viewSize.height
    const ratioW = data.width / viewSize.width
    let h
      , v

    if (this.isMaster) {
      console.log("isMaster of group", Session.get("group_id"))
      share.call({
        _id: Session.get("group_id")
      , key: "viewSize"
      , data
      })
    }

    if (ratioH > ratioW) {
      // Show view as wide as possible but reduce height
      v = data.width / 100
      h = data.height * ratioW / 100

    } else {
      // Show view as tall as possible but reduce width
      v = data.width * ratioH / 100
      h = data.height / 100
    }

    // In Styled Components, these values will be made available as:
    // • this.props.u.v
    // • this.props.u.h
    // • this.props.u.min
    // • this.props.u.max
    const units = {
      v
    , h
    , min: Math.min(v, h)
    , max: Math.max(v, h)
    , wide: v > h
    }
    this.props.setSize(units)
  }


  render() {
    const style = {
      display: "flex"
    , justifyContent: "center"
    , alignItems: "center"
    , height: "100vh"
    , border: "5px dotted rgba(255, 0, 0, 0.5)"
    , boxSizing: "border-box"
    }

    return <div
      style={style}
      id="share"
    >
      {this.props.children}
    </div>
  }
}


export default withTracker(() => {
  // Get the local size by default
  let viewSize   = getViewSize()
  let master     = ""

  const _id      = Session.get("group_id")
  const user_id  = Session.get("user_id") // undefined for a teacher

  if (_id) {
    const group_data = Groups.findOne({ _id })

    if (group_data) {
      master = group_data.master // may be undefined

      if (group_data.viewSize) {
        // Use the size defined by the group's master if it exists
        viewSize = group_data.viewSize
      }
    }
  }

  return { viewSize, master, user_id }
})(Share)