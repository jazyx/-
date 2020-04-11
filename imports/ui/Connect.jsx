import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react'

import { Session } from 'meteor/session'

import Splash   from './connect/Splash.jsx'
import Native   from './connect/Native.jsx'
import Name     from './connect/Name.jsx'
import Teacher  from './connect/Teacher.jsx'
import Submit   from './connect/Submit.jsx'
import Teach    from './connect/Teach.jsx'

import Language from './connect/Language.jsx' // to be used later

import collections from '../api/collections'
import storage from '../tools/storage'

import { reGroup } from '../api/methods'



export default class Connect extends Component {
  constructor(props) {
    super(props)

    /// <<< HARD-CODED minimum time (ms) to show the Splash screen
    const splashDelay = 1000
    this.reconnectDelay = 60 * 1000
    /// HARD-CODED >>>

    this.state = {
      view: "Splash"
    , showSplash: + new Date() + splashDelay
    }

    this.setView             = this.setView.bind(this)
    this.hideSplash          = this.hideSplash.bind(this)
    this.groupsCallback      = this.groupsCallback.bind(this)
    this._pollForCollections = this._pollForCollections.bind(this)

    this.connectToRemoteDB() // calls prepareConnection() when ready
  }


  /** Starts polling for enough data from MongoDB to start the app
   * then prepareConnection will be called.
   */
  connectToRemoteDB() {
    this.views = {
      Splash
    , Native
    , Name
    , Teacher
    , Submit
    , Teach
    , Language
    }

    // When the application is first loaded, the server will not yet
    // have had time to populate the miniMongo collections, so they
    // will exist but they will be empty. Show a splash screen until
    // the collections are ready.

    // For each collection that is required at startup, add an object
    // with a `query` which will return a minimum number of documents,
    // plus a `count` property whose value is this required minimum.
    // If it's enough to have a single document in the collection,
    // you can use 0 as the value for the collection name
    // property.

    this.requiredQueries = {
      "L10n": [
        { query: { folder: { $exists: true } }
        , count: 1
        }
      , { query: { file: { $exists: true} }
        , count: 4
        }
      ]
    , "Drag": [
        { query: { folder: { $exists: true } }
        , count: 1
        }
      , { query: { file: { $exists: true} }
        , count: 6
        }
      ]
    , "Teachers": [
        { query: { folder: { $exists: true } }
        , count: 1
        }
      , { query: { file: { $exists: true} }
        , count: 3
        }
      ]
    , "Activities": [
        { query: {}
        , count: 1
        }
      ]
    , "Users": [
        { query: {}
        , count: 0
        }
      ]
    }

    // Subscribe to the required collections
    for (let collectionName in this.requiredQueries) {
      const collection = collections[collectionName]
      Meteor.subscribe(collection._name)
    }

    this._pollForCollections() // calls prepareConnection() when ready
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


  groupsCallback(error, data) {
    console.log("groupsCallback(", error, ", ", data, ")")
  }


  hideSplash() {
    if (+ new Date() > this.state.showSplash) {
      return setTimeout(this.hideSplash, 100)
    }

    const view = this.state.go
    this.setState({ showSplash: 0, view })
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

  _pollForCollections() {
    const collectionNames = Object.keys(this.requiredQueries)
    const basic = [ { query: {}, count: 1 } ]

    const ready = collectionNames.every(collectionName => {
      const collection = collections[collectionName]
      const checks     = this.requiredQueries[collectionName] || basic

      const checked    = checks.every(check => {
        const query    = check.query || {}
        const count    = isNaN(check.count)
                       ? 1
                       : check.count
        const passed   = collection.find(query).count() >= count

        return passed
      })

      return checked
    })

    if (ready) {
      this.prepareConnection()

    } else {
      setTimeout(this._pollForCollections, 100)
    }
  }


  _SetSessionData() {
    const storedData = storage.get()
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

    const teacher_id = Session.get("teacher")
    const user_id = Session.get("user_id")
    const join = true
    reGroup.call({ teacher_id, user_id, join}, this.groupsCallback)
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
