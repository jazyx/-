import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../../api/collections'
import storage from '../../tools/storage'
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

    if (error) {
      save = error // cannot be localized
      console.log(error)

    } else {
      this.noviceData.user_id = Session.get("user_id")
      // may be from localStorage
    }

    storage.set(this.noviceData)

    this.setState({ save })

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
