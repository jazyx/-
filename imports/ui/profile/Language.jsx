import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { L10n } from '../../api/collections'
import { localize } from '../../tools/utilities'

import { StyledProfile
       , StyledPrompt
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './styles'




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
  const key    = "phrase"
  const select = {
    $or: [
      { cue: "which_language" }
    , { cue: "next" }
    ]
  }
  const phrases = L10n.find(select).fetch()

  return {
    phrases
  }
})(Language)
