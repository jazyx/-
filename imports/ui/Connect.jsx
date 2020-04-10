import React, { Component } from 'react'

import { Meteor } from 'meteor/meteor'
import { Session } from 'meteor/session'

import Splash   from './connect/Splash.jsx'
import Native   from './connect/Native.jsx'
import Name     from './connect/Name.jsx'
import Learning from './connect/Learning.jsx'
import Teacher  from './connect/Teacher.jsx'
import Submit   from './connect/Submit.jsx'
import Teach   from './connect/Teach.jsx'

import collections from '../api/collections'



export default class Connect extends Component {
  constructor(props) {
    super(props)

    /// <<< HARD-CODED minimum time (ms) to show the Splash screen
    const splashDelay = 1000
    /// HARD-CODED >>>
   
    this.state = {
      view: "Splash"
    , showSplash: + new Date() + splashDelay
    }

    this.connectToRemoteDB()
    this.storedData = this.readFromLocalStorage()
  }


  readFromLocalStorage() {
    if ("localStorage" in window) {
      try {
        const noviceString = localStorage.getItem("vdvoyom_profile")
        const noviceData = JSON.parse(noviceString)
        const keys = Object.keys(noviceData)

        keys.forEach(key => {
          Session.set(key, noviceData[key]) // TEMPORARY COMMENT
        })
        
      } catch(error) { }
    }
  }


  connectToRemoteDB() {
    this.views = {
      Splash
    , Native
    , Name
    , Learning
    , Teacher
    , Submit
    , Teach
    }
    this.setView = this.setView.bind(this)
    this._checkForCollections = this._checkForCollections.bind(this)

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

    this._checkForCollections()
  }


  _checkForCollections() {
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

    if (ready && (+ new Date() > this.state.showSplash)) {
      this.hideSplash()

    } else {
      setTimeout(this._checkForCollections, 100)
    }
  }


  _checkURLForTeacherName() {
    const search = window.location.search
    let teacher  = new URLSearchParams(search).keys().next().value

    if (teacher) {
      const query = { file: { $exists: 1 } }
      const teachers = collections["Teachers"].find(query).fetch()

      teacher = teachers.reduce((input, teacherData) => {
        const name = teacherData.name[teacherData.script]
        if (name === teacher) {
          input = teacherData
        }

        return input
      }, null)
    }

    return teacher
  }



  hideSplash() {
    let view = "Native"
    const teacher = this._checkURLForTeacherName()
    
    if (teacher) {
      Session.set("teacher",    teacher.name[teacher.script])
      Session.set("teacher_id", teacher.id)
      Session.set("native",     teacher.language)
      view = "Teach"
    }
 
    // if (Session.get("user_id")) {
    //   // Jump straight to the Activity view
    //   this.props.setView("Activity")

    // } else {
      // Step through the profiling procedure for first-time visitors
      this.setState({ showSplash: 0, view })
    // }
  }


  setView(view) {
    if (!view) {
      this.setState({
        view: "Splash"
      , showSplash: + new Date()
      })
      this._checkForCollections()

    } else if (!this.views[view] ) {
      // Move back up the hierarchy
      this.props.setView(view)

    } else {
      this.setState({ view })
    }
  }


  render() {
    const View = this.views[this.state.view]

    return <View setView={this.setView} />
  }
}