import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react'

import { Session } from 'meteor/session'

import Splash   from './connect/Splash.jsx'
import Native   from './connect/Native.jsx'
import Name     from './connect/Name.jsx'
import Teacher  from './connect/Teacher.jsx'
import Submit   from './connect/Submit.jsx'
import Teach    from './connect/Teach.jsx'
import TimeOut  from './connect/TimeOut.jsx'

import Language from './connect/Language.jsx' // to be used later

import collections from '../api/collections'
import Storage from '../tools/storage'
import Share from '../tools/share'

import { log
       , reGroup
       } from '../api/methods'
import { removeFrom } from '../tools/utilities'



export default class Connect extends Component {
  constructor(props) {
    super(props)

    /// <<< HARD-CODED minimum time (ms) to show the Splash screen
    const splashDelay = 1000
    const timeOutDelay = 10 * 1000
    this.reconnectDelay = 60 * 1000
    /// HARD-CODED >>>

    this.views = {
      Splash
    , Native
    , Name
    , Teacher
    , Submit
    , Teach
    , Language
    , TimeOut
    }

    this.state = {
      view: "Splash"
    , showSplash: + new Date() + splashDelay
    }
    this.unReady = []

    this.ready              = this.ready.bind(this)
    this.setView            = this.setView.bind(this)
    this.hideSplash         = this.hideSplash.bind(this)
    this.groupsCallback     = this.groupsCallback.bind(this)
    this.connectionTimedOut = this.connectionTimedOut.bind(this)

    this.connectToMongoDB() // calls prepareConnection() when ready

    // Loading takes about 250ms when running locally
    this.timeOut = setTimeout(this.connectionTimedOut, timeOutDelay)
  }


  connectToMongoDB() {
    for (let collectionName in collections) {
      this.unReady.push(collectionName)

      const collection = collections[collectionName]
      // We could send (multiple) argument(s) to the server publisher
      const callback = () => this.ready(collectionName)
      Meteor.subscribe(collection._name, callback)
    }
  }


  ready(collectionName) {
    removeFrom(this.unReady, collectionName)

    if (!this.unReady.length) {
      if (this.timeOut) {
        clearTimeout(this.timeOut)
        this.prepareConnection()
      }
    }
  }


  connectionTimedOut() {
    this.timeOut = 0 // this.prepareConnection will not trigger now
    this.setState({ showSplash: 0, view: "TimeOut" })
  }


  /** MongoDB is ready: use it to check which view to show
   *
   *  Four cases:
   *  1. New user
   *  2. Returning user
   *  3. Teacher
   *  4. Admin
   *
   *  A new user needs to go down the native, name, teacher path
   *  Returning user:
   *    • (When menu is available or if * is in path), resume
   *    • Until menu is available, review profile
   *  A teacher:
   *    • Rejoin a group that was active and which still has a student
   *    • Go to Teach if not
   *  Admin: TBD
   */
  prepareConnection() {
    this._SetSessionData()
    // First time user: no Session data
    // Returning user:  user_id is set
    // Teacher:         teacher_id is set

    switch (Session.get("role")) {
      case "admin":
      // TODO
      break

      case "teacher":
        this._checkForActiveGroup()
      break

      case "user":
        this._reJoinGroups()
      break

      default:
        this.setState({ go: "Native" })
        this.hideSplash()
    }
  }


  groupsCallback(error, groups) {
    if (error) {
      // Unable to join existing groups
      this.setState({ go: "Native"} )
      return this.hideSplash()
    }

    // // console.log(Session.keys)
    // language: ""en-GB""
    // native:   ""ru""
    // role:     ""user""
    // teacher:  ""jn""
    // user_id:  ""y6sQmtm5DGqE27S95""
    // username: ""Влад"
    // +
    // group_id: ""aKEisZAmCpPEq5qKC""

    groups.every(group=> {
      if (group.master === Session.get("user_id")) {
        Session.set("group_id", group._id)

        Share.setAsMaster(group._id)
        this.setState({ go: group.activity })
        this.hideSplash()

        return false
      }

      return true
    })
  }


  hideSplash() {
    if (+ new Date() < this.state.showSplash) {
      return setTimeout(this.hideSplash, 100)
    }

    const view = this.state.go
    if (!this.views[view]) {
      // We're going up a level
      this.setView(view)

    } else {
      this.setState({ showSplash: 0, view })
    }
  }


  setView(view) {
    if (!view) {
      // A database was updated on the fly. Wait until it's online
      // again and then return to where we were
      this.setState({
        view: "Splash"
      , showSplash: + new Date()
      })
      this._pollForCollections()

    } else if (!this.views[view] ) {
      // Move back up the hierarchy
      this.props.setView(view)

    } else {
      this.setState({ view })
    }
  }


  /// HELPERS /// HELPERS /// HELPERS /// HELPERS /// HELPERS  /// ///


  _SetSessionData() {
    const storedData = Storage.get()
    const keys = Object.keys(storedData)
    const teacher = this._checkURLForTeacherName()
    // TODO: Add test for admin

    if (teacher) {
      Session.set("teacher_id", teacher.id)
      Session.set("native",     teacher.language)
      Session.set("role",       "teacher")

    } else if (keys.length) {
      Session.set("role",       "user")

      for (let key in storedData) {
        Session.set(key, storedData[key])
      }
    } else {
      // First time user on this device
    }
  }


  _checkURLForTeacherName() {
    // http://activities.jazyx.com/<teacher_id>
    // http://activities.jazyx.com/?teacher=<teacher_id>

    let id = window.location.pathname.substring(1) // /id => id
    let teacher = this._getTeacher(id)

    if (!teacher) {
      const search = window.location.search.toLowerCase()
      id = new URLSearchParams(search).get("teacher")
      if (id) {
        teacher = this._getTeacher(id)
      }
    }

    return teacher
  }


  _getTeacher(id) {
    id = decodeURI(id)
         .replace(/^аа$/, "aa") // Russian а to Latin a for Настя
    return collections["Teachers"].findOne({ id })
  }


  /** Check if the connection just broke and if so, log back in
   *  to the shared group. Otherwise, go to the Teach view.
   */
  _checkForActiveGroup() {
    // TODO: Integrate menu then remove the following 2 lines
    this.setState({ go: "Teach" })
    return this.hideSplash()

  }


  _reJoinGroups() {
    // TODO: Integrate menu then remove the following 3 lines
    if (!window.location.pathname.startsWith("/*") ) {
      console.log("Returning user:", Session.get("username"))
      this.setState({ go: "Native"} )
      return this.hideSplash()
    }

    const user_id = Session.get("user_id")
    const params = {
      teacher_id: Session.get("teacher")
    , user_id
    , join:      true
    }
    const callback = this.groupsCallback

    log.call({ id: user_id, in: true })
    reGroup.call(params, callback)
  }


  _msSinceLastSeen() {
    let elapsed = 0

    const _id = Session.get("user_id")
    const user = collections["Users"].findOne({ _id })
    if (user) {
      const loggedOut = new Date(user.loggedOut)
      elapsed = + new Date() - loggedOut
    }

    console.log("elapsed:", elapsed)

    return elapsed
  }


  _reconnect() {
    let view = "Native"
    const id = Session.get("user_id")

    if (id) {
      // const elapsed = this._msSinceLastSeen()

      // if (elapsed && elapsed < this.reconnectDelay) {
        this._reJoinGroups()
      // }
    }

    return view
  }

  /// RENDER /// RENDER /// RENDER /// RENDER /// RENDER /// RENDER //

  render() {
    const View = this.views[this.state.view]

    return <View setView={this.setView} />
  }
}
