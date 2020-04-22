import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../../api/collections'
import Storage from '../../tools/storage'
import { localize
       , getRandomFromArray 
       } from '../../tools/utilities'
import { logIn } from '../../api/methods/methods'

import { StyledCentred } from '../styles'



class Submit extends Component {
  constructor(props) {
    super(props) // { phrases }

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
    // d_code:   "xTG3"              // or created here on Client
    // 
    // user_id:  "g5Q3geSR2KuigZybJ" // created on Server
    // q_code:   "0294"              //        —"—
    // view:     "Activity"          // —"— but updated on Client
    // viewData: {...}               // created on Client
 
    // Add the data that we can be sure of having, through the user
    // input, or by calculation.
    const d_code = Session.get("d_code")
                || this.setD_code()

    this.accountData = {
      native:   Session.get("native")
    , username: Session.get("username")
    , language: Session.get("language")
    , teacher:  Session.get("teacher")
    , d_code:   d_code
    }

    // Add data that could have been read in from the localStorage
    const savedKeys = [
      "q_code"
    , "user_id"
    , "group_id"
    ]
    savedKeys.forEach(key => {
      const value = Session.get(key)
      if (value) {
        this.accountData[key] = value
      }
    })

    logIn.call(this.accountData, this.callback)
  }


  callback(error, data) {
    console.log("Submit callback", "error:", error, "data:", data)

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
      this.accountData.q_code = q_code
      this.accountData.user_id = user_id
      this.accountData.group_id = group_id
      saved = true
    }

    // Save permanently to localStorage (if available)
    const stored = Storage.set(this.accountData)

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
    Session.set("view",     view)

    // Show the save message...
    this.setState({ save })

    // ... for just long enough
    setTimeout(
      () => this.props.setView("NewPIN")
    , this.delay
    )
  }


  setD_code() {
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

    Session.set("d_code", d_code)

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
