import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../../api/collections'
import { localize } from '../../core/utilities'

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


  getPrompt() {
    const cue = "choose_teacher"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  getButtonBar() {
    const cue = "next"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

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
