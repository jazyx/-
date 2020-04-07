import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../../api/collections'

import { StyledProfile
       , StyledPrompt
       , StyledInput
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './Styles'




class Teacher extends Component {
  constructor(props) {
    super(props)

    this.state = { ready: false }
  }


  getPhrase(cue) {
    let code = Session.get("native") // en-GB | ru
    let phrase = this.props.phrases.find(phrase => (
      phrase.cue === cue
    ))[code]

    if (!phrase) {
      // Check if there is a more generic phrase without the region
      code = code.replace(/-\w+/, "") // en | ru
      phrase = this.props.phrases.find(phrase => (
        phrase.cue === cue
      ))[code]
    }

    if (!phrase) {
      phrase = "***" + cue * "***"
    }

    return phrase
  }


  getPrompt() {
    const prompt = this.getPhrase("choose_teacher")

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  getButtonBar() {
    const prompt = this.getPhrase("next")

    return <StyledButtonBar>
      <StyledNavArrow
        way="back"
        disabled={false}
        onMouseUp={() => this.props.setView("Learning")}
      />
      <StyledButton
        disabled={!this.state.ready}
        onMouseUp={this.setTeacher}
      >
        {prompt}
      </StyledButton>
      <StyledNavArrow
        invisible={true}
      />
    </StyledButtonBar>
  }


  render() {
    const prompt = this.getPrompt()
    const buttonBar = this.getButtonBar()

    return <StyledProfile
      id="teacher"
    >
      {prompt}
      {buttonBar}
    </StyledProfile>
  }
}



export default withTracker(() => {
  const collection  = collections["L10n"]
  Meteor.subscribe(collection._name)

  const key         = "phrase"
  const phraseQuery = {
    $and: [
      { type: { $eq: key }}
    , { file: { $exists: false }}
    ]
  }
  const phrases = collection.find(phraseQuery).fetch()

  return {
    phrases
  }
})(Teacher)
