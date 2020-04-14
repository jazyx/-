/**
 * imports/ui/Share.jsx
 *
 * The Share component provides a wrapper div for the whole interface.
 * Users who are teachers will, by design, join each group as a slave
 * so that their students can use their entire screen estate.
 *
 * In one-on-one sessions, the student will always be master. In
 * group lessons, only one student will be master. There will always
 * be a master in every group. In a many-student group, a master will
 * be chosen from those logged on when the teacher starts the group.
 * If that student leaves, mastery will be transferred to another
 * student, or the group will be dissolved. If a student changes
 * groups their status as master may change.
 *
 * This script is designed to share the view dimensions of the
 * device which is master. This may happen in three ways:
 *
 * 1. When the master first arrives
 * 2. If the master changes (this user may stop being master)
 * 3. If the current master alters the size of their browser window
 *    or flips orientation on their phone or tablet.
 *
 * <Share /> is re-rendered if
 * • The window is resized, which changes App.state.aspectRatio and
 *   tells App to request a new render
 * • Session group_id or isMaster changes, which will be detected
 *   in the withTracker() function
 */

import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

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

    this.isMaster    = undefined
    this.aspectRatio = undefined
    this.setViewSize = this.setViewSize.bind(this)

    // When the local window is resized one of two things should
    // happen:
    // 1. If this device is master, it should tell all the slave
    //    devices to update their display
    // 2. If this device is a slave, it should resise the master's
    //    view to fit optimally in the current view area
    window.addEventListener("resize", this.setViewSize, false)
    this.setViewSize()
  }


  setViewSize() {
    // Before user has logged in, Session will be empty,
    // this.props.viewSize will be (by default) the local body size
    // and this.isMaster will be true (even for teachers)
    const localSize = getViewSize()
    const { width, height} = localSize
    const viewSize = this.isMaster
                   ? localSize
                   : this.props.viewSize // set by remote master
    const ratioH = height / viewSize.height
    const ratioW = width / viewSize.width
    let h
      , w

    if (ratioH > ratioW) {
      // Show view as wide as possible but reduce height
      w = width / 100
      h = height * ratioW / ratioH / 100

    } else {
      // Show view as tall as possible but reduce width
      w = width * ratioH / ratioW / 100
      h = height / 100
    }

    this.units = {
      "--w":   w + "px"
    , "--h":   h + "px"
    , "--min": Math.min(w, h) + "px"
    , "--max": Math.max(w, h) + "px"
    }

    // This component is only re-rendered if the State of the parent
    // App are changed, in which case. the rerenders can happen many
    // times a second. Besides, we need to provide the right
    // aspectRatio

    const aspectRatio = w / h
    const newMaster = this.props.isMaster && !this.isMaster
    this.isMaster = this.props.isMaster

    // Don't reset App's state.aspectRatio unnecessarily, or we get
    // an endless loop of renders

    if (this.aspectRatio !== aspectRatio || newMaster) {
      this.aspectRatio = aspectRatio
      this.shareViewSizeIfMaster(localSize)
      this.props.setAspectRatio(aspectRatio)
    }
  }


  shareViewSizeIfMaster(data) {
    if (this.props.isMaster) {
      share.call({
        _id: this.props.group_id
      , key: "viewSize"
      , data
      })
    }
  }


  render() {
    const style = Object.assign({
      position: "relative"
    , display: "flex"
    , justifyContent: "center"
    , alignItems: "center"
    , height: "calc(100 * var(--h))"
    }
    , this.units
    )

    return <div
      style={style}
      id="share"
    >
      {this.props.children}
    </div>
  }


  componentDidUpdate() {
    this.setViewSize()
  }
}


export default withTracker(() => {
  // Get the local size by default
  let viewSize   = getViewSize()

  // Accessing reactive Session variables ensures that the Share
  // component is re-rendered if one of the values changes. Both
  // Session variables below start as undefined, and change when a
  // user logs in or switches groups. This mean that Share is usually
  // only re-rendered just after login... or if the view size changes,
  // as handled by setViewSize() above.

  // group_id changes when user changes teacher or changes groups
  const group_id = Session.get("group_id")

  // isMaster only changes in bigger groups
  const isMaster = Session.get("isMaster") // false for a teacher

  if (group_id) {
    const group_data = Groups.findOne({ _id: group_id })

    if (group_data && group_data.viewSize) {
      // Use the size defined by the group's master if it exists
      viewSize = group_data.viewSize
    }
  }

  return { group_id, isMaster, viewSize }
})(Share)