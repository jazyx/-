import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../../api/collections'
import Storage from '../../tools/storage'
import Share from '../../tools/share'
import { localize } from '../../tools/utilities'
import { createNovice
       , log
       } from '../../api/methods'

import { StyledCentred } from './Styles'



class Submit extends Component {
  constructor(props) {
    super(props)

    this.state = { save: "saving" }
    /// <<< HARD-CODED
    this.delay = 1000
    /// HARD-CODED >>>

    this.noviceData = {
      native:   Session.get("native")
    , username: Session.get("username")
    , language: Session.get("language")
    , teacher:  Session.get("teacher")
    }
    this.callback = this.callback.bind(this)

    createNovice.call(this.noviceData, this.callback)
  }


  callback(error, data) {
    let save = "save_failed"
    let saved = false
    const { user_id, group_id } = data || {}

    if (error) {
      save = error // cannot be localized
      console.log(error)

    } else {
      this.noviceData.user_id = user_id
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

    Session.set("user_id", user_id)
    Session.set("group_id", group_id)
    Share.setAsMaster(group_id)

    // Show the save message...
    this.setState({ save })

    // ... for just long enough
    setTimeout(
      () => this.props.setView("Activity")
    , this.delay
    )
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
