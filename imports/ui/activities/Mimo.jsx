import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../../api/collections'
import { localize } from '../../tools/utilities'

import { StyledProfile
       , StyledPrompt
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './Styles'




class Language extends Component {
  constructor(props) {
    super(props)

    this.state = { ready: false }
  }


  getPrompt() {
    const cue = "which_language"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  //// PROVIDE A LIST OF LANGUAGES ////


  getButtonBar() {
    const cue = "next"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)
    const disabled = !Session.get("teacher")

    return <StyledButtonBar>
      <StyledNavArrow
        way="back"
        disabled={false}
        onMouseUp={() => this.props.setView("Name")}
      />
      <StyledButton
        disabled={!this.state.ready}
        onMouseUp={this.setTeacher}
      >
        {prompt}
      </StyledButton>
      <StyledNavArrow
        way="forward"
        disabled={disabled}
        onMouseUp={() => this.props.setView("Teacher")}
      />
    </StyledButtonBar>
  }


  render() {
    const prompt = this.getPrompt()
    const buttonBar = this.getButtonBar()

    return <StyledProfile
      id="language"
    >
      {prompt}
      {buttonBar}
    </StyledProfile>
  }
}



export default withTracker(() => {
  const collection  = collections["L10n"]
  Meteor.subscribe(collection._name, "Mimo")

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
})(Language)
