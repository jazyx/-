import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../../api/collections'
import Storage from '../../tools/storage'
import { localize
       , getRandomFromArray 
       } from '../../tools/utilities'
import { createNovice
       , log
       } from '../../api/methods'

import { StyledCentred } from '../styles'



class Submit extends Component {
  constructor(props) {
    super(props)

    this.state = { save: "saving" }
    /// <<< HARD-CODED
    this.delay = 1000
    /// HARD-CODED >>>

    this.callback = this.callback.bind(this)

    // Session data
    // === for all users
    // native:   "en-GB"
    // username: "James"
    // language: "ru"
    // teacher:  "aa"
    // === for returning users with data from localStorage
    // user_id:  "g5Q3geSR2KuigZybJ"
    // q_code:   "0294"
    // d_code:   "xTG3"
    // view:     "Activity"
 
    const d_code = Session.get("d_code") || this.getD_code()

    this.noviceData = {
      native:   Session.get("native")
    , username: Session.get("username")
    , language: Session.get("language")
    , teacher:  Session.get("teacher")
    , d_code:   d_code
    }

    if (Session.get("user_id")) {
      // This is a returning user logging in automatically
      log.call(
        { d_code
        , in: true
        , id: Session.get("user_id")
        , teacher: Session.get("teacher")
        }
      , this.callback
      )

    } else {
      // This is either:
      // * A new user
      // or
      // * A returning user on a new device or logging in from a
      //   machine that has no localStorage

      createNovice.call(this.noviceData, this.callback)
    }
  }


  callback(error, data) {
    let save = "save_failed"
    let saved = false
    const { user_id, q_code, group_id, view } = data || {}

    if (error) {
      save = error // cannot be localized
      console.log(error)

      // Will it be possible to continue? We know that the database
      // was accessible on startup, so perhaps all the necessary data
      // is already available locally.

    } else {
      this.noviceData.user_id = user_id
      this.noviceData.q_code = q_code
      saved = true
    }

    // Save permanently to localStorage (if available)
    const stored = Storage.set(this.noviceData)

    if (saved) {
      if (stored) {
        save = "save_successful"
      } else {
        save = "save_not_stored"
      }
    } else if (stored) {
      save = "stored_only"
    }

    Session.set("user_id",  user_id)
    Session.set("group_id", group_id)
    Session.set("code",     code)
    Session.set("isMaster", true)
    Session.set("view",     view)

    // Show the save message...
    this.setState({ save })

    // ... for just long enough
    setTimeout(
      () => this.props.setView("NewPIN")
    , this.delay
    )
  }


  getD_code() {
    let d_code    = ""
    const source = "0123456789&#"
                 + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                 + "abcdefghijklmnopqrstuvwxyz"
    const length = source.length
    const total  = 5 //        Creates 1,073,741,824 possible strings
    // const total  = 7 // Creates 4 398 046 511 104 possible strings
    for ( let ii = 0; ii < total; ii += 1 ) {
      d_code += getRandomFromArray(source)
    }

    return d_code
  }


  render() {
    const cue = (this.state.save)
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledCentred>
      <h1>{prompt}</h1>
    </StyledCentred>
  }
}



export default withTracker(() => {
  // Phrases and flags
  const l10n  = collections["L10n"]
  Meteor.subscribe(l10n._name)

  const phraseQuery = {
    $and: [
      { type: { $eq: "phrase" }}
    , { file: { $exists: false }}
    ]
  }
  const phrases = l10n.find(phraseQuery).fetch()

  const props = {
    phrases
  }

  return props
})(Submit)
