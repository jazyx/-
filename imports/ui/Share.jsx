/**
 * imports/ui/Share.jsx
 *
 * The Share component has three purposes:
 * 1. To subscribe to all the non-activity collections, so that these
 *    will be immediately available elsewhere. This is delegated to
 *    a StartUp instance.
 * 2. As detailed below, to preserve the aspect ratio of a student's
 *    device when it is shown on the teacher's (or another student's)
 *    screen. This means tracking both when the master changes and
 *    when the aspect ratio of the master or the current device
 *    changes.
 * 3. To return the Teacher to the Teach view when the last student in
 *    a group leaves.
 *
 * Aspect ratio
 * ============
 * The Share component provides a wrapper div for the whole interface.
 * Teachers will, by design, join each group as a slave so that their
 * students can use their entire screen estate.
 *
 * In one-on-one sessions, the student will always be master. In
 * group lessons, only one student will be master. There will always
 * be a master in every group. In a many-student group, a master will
 * be chosen from those logged on when the teacher starts the group.
 * If that student leaves, mastery will be transferred to another
 * student, or the group will be dissolved. In addition, if a student
 * changes groups their status as master may change.
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
 *
 * Teacher Redirection
 * ===================
 *
 */


import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

// Subscriptions
import { Groups } from '../api/collections'

// viewSize
import { share } from '../api/methods/methods'
import StartUp from './startup/StartUp'


// For debugging only
let instance = 0
let render = 0


// Called by the track function that is wrapped by withTracker
// and by Share.setViewSize() when the group_id changes or the window
// is resized.
const getViewSize = () => {
  const { width, height } = document.body.getBoundingClientRect()
  return { width, height }
}


class Share extends Component {
  constructor(props) {
    super(props)

    // Debugging only
    // console.log("Share instance", ++instance)

    this.startedUp   = false
    this.aspectRatio = undefined
    this.view        = undefined

    this.setViewSize = this.setViewSize.bind(this)

    // When the local window is resized one of two things should
    // happen:
    // 1. If this device is master, it should tell all the slave
    //    devices to update their display
    // 2. If this device is a slave, it should resise the master's
    //    view to fit optimally in the current view area
    window.addEventListener("resize", this.setViewSize, false)

    // Subscribe to all collections, then hide Splash screen when done
    new StartUp(this.setViewSize)
  }


  initialize() {
    this.startedUp = true

    // These values remain fixed for this session. The Session
    // variables are set in the StartUp instance when all the
    // collections are available, just before the setViewSize method
    // below is called.

    this.isTeacher   = Session.get("role") === "teacher"
    this.d_code      = Session.get("d_code")
  }


  /**
   * Called once by hideSplash in StartUp, when `view` will be a
   * string.
   *
   * Called by window.resize any time the user changes the orientation
   * of their device, or changes the size of their browser window. In
   * this case, view will be a resize event.
   *
   * Action:
   */
  setViewSize(view) {
    if (typeof view === "string") {
      if (!this.startedUp) {
        this.initialize()

      } else if ( this.view === view ) {
        return
      }

      this.view = view
      if (view === "Teach") {
        // console.log("setViewSize(\"Teach\")")
      }

    } else {
      // Ignore view when it is a resize event
      view = undefined
    }

    const isMaster = this.props.master === this.d_code

    // We need to compare masterSize and (local) viewSize, to
    // calculate view ratios.
    const viewSize = getViewSize()
    const { width, height } = viewSize
    const masterSize = isMaster || !this.props.active
                     ? viewSize
                     : this.props.viewSize
    // this.props.viewSize is set by remote master if active. If no
    // remote master, is set locally and is identical to viewSize

    const ratioH = height / masterSize.height
    const ratioW = width / masterSize.width
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

    // Don't reset App's state.aspectRatio unnecessarily, or we get
    // an endless loop of renders

    // console.log(
    //   "setViewSize — aspect has changed?"
    // , this.aspectRatio !== aspectRatio
    // , "; newMaster?"
    // , newMaster)

    if (this.aspectRatio !== aspectRatio || view) {
      this.aspectRatio = aspectRatio
      if (isMaster) {
        this.shareMasterView(viewSize)
      }

      this.convertToLocalArea(viewSize, h, w)

      // If the call comes from the StartUp instance, then view will
      // be a string, and this.props.setViewSize will point to
      // App.setViewAndSize, just this once. If the window is being
      // resized, view will be a resize event, and should be ignored.

      const output = { aspectRatio, viewSize }
      if (view) {
        output.view = view
      }

      this.props.setViewSize(output)
    }
  }


  convertToLocalArea(viewSize, h, w) {
    viewSize.top = (viewSize.height - h * 100) / 2
    viewSize.left = (viewSize.width - w * 100) / 2
  }


  shareMasterView(data) {
    share.call({
      _id: this.props.group_id
    , key: "viewSize"
    , data
    })
  }


  render() {
    // console.log("Share render", ++render, this.props.tag)

    const style = Object.assign({
      position: "relative"
    , display: "flex"
    , justifyContent: "center"
    , alignItems: "center"
    , height: "calc(100 * var(--h))"
    , width: "calc(100 * var(--w))"
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


  // Changes detected in the wrapped track function will trigger a
  // new render, using the unchanged values. We have to wait until
  // after this unmodified render is complete before we use setState.
  // A new viewSize sent from a remote master will be shown with a lag
  // of one render.
  //
  // If the re-render was triggered by a new aspect ratio on this
  // device, setView will already have been called. A new call will
  // thus be redundant, and will not change anything, so a double
  // render should not occur.

  componentDidUpdate() {
    if (this.startedUp) {
      const view = this.isTeacher
                 ? this.props.teacherView // <activity> | "Teach"
                 : undefined

      // console.log("Share componentDidUpdate setViewSize(\"" + view + "\")")
      this.setViewSize(view)
    }
  }


  // Called after a render is complete, if this latest render did not
  // include this component. This should only happen when the app as
  // a whole is being unloaded from the browser, so this may be
  // redundant.
  componentWillUnmount() {
    for (let subscriptionName in this.subscriptions) {
      // console.log("Unsubscribing from", subscriptionName)
      this.subscriptions[subscriptionName].stop()
    }
  }
}


let track = 0

export default withTracker(() => {
  // Get the local size by default
  let viewSize   = getViewSize()

  // Accessing reactive Session variables ensures that the Share
  // component is re-rendered if one of the values changes. Both
  // Session variables below start as undefined, and change when a
  // user logs in or switches groups. This mean that the code here
  // usually only triggers a re-render of Share just after login.
  //
  // However, a re-render will also be trigger if the view size
  // changes, as handled by setViewSize() above.

  // group_id changes when user changes teacher or changes groups
  const group_id = Session.get("group_id") // may change

  let teacherView = "Teach"
  let group_data  = undefined
  let master      = undefined // always undefined for a teacher

  if (group_id) {
    const select = { _id: group_id }
    const project = { loggedIn: 1, active: 1, viewSize: 1, view: 1 }
    group_data = Groups.findOne(select, project)
  }

  let { active, loggedIn, view } = (group_data || {}) // undefined?

   if (group_data && (active = active || false)) {
    // If active show the Activity view
    master = loggedIn[0]
    teacherView = view

    if (group_data.viewSize) {
      // Use the size defined by the group's master if it exists
      viewSize = group_data.viewSize
    }
  }

  // console.log("Share track:", track += 1
  //            , "group_id:", group_id
  //            , "active:", active
  //            , "master:", master
  //            , "teacherView:", teacherView
  //            , "viewSize:", viewSize
  //            )

  return { group_id, active, master, teacherView, viewSize }
})(Share)