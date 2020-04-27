import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { L10n } from '../../api/collections'
import { localize } from '../../tools/utilities'

import { StyledProfile
       , StyledPrompt
       , StyledPIN
       , StyledP
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './styles'




class NewPIN extends Component {
  constructor(props) {
    super(props)

    this.goNext = this.goNext.bind(this)
    document.addEventListener("keydown", this.goNext, false)
  }


  goNext(event) {
    if (event && event.type === "keydown" && event.key !== "Enter") {
      return
    }

    console.log("NewPIN view", Session.get("view"))
    this.props.setView(Session.get("view"))
    // this.props.setView("CheckPIN")
  }


  getPrompt() {
    const code = Session.get("native")

    let cue = "remember_pin"
    const prompt = localize(cue, code, this.props.phrases)
    const PIN = Session.get("q_code")
    cue = "pin_reason"
    const reason = localize(cue, code, this.props.phrases)

    return <StyledProfile>
      <StyledPrompt>
        {prompt}
      </StyledPrompt>
      <StyledPIN>
        {PIN}
      </StyledPIN>
      <StyledP>
        {reason}
      </StyledP>
    </StyledProfile>
  }


  getButtonBar() {
    const cue = "pin_memorized"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledButtonBar>
      <StyledNavArrow
        way="back"
        invisible={true}
      />
      <StyledButton
        disabled={false}
        onMouseUp={this.goNext}
      >
        {prompt}
      </StyledButton>
      <StyledNavArrow
        way="forward"
        invisible={true}
      />
    </StyledButtonBar>
  }


  render() {
    const prompt = this.getPrompt()
    const buttonBar = this.getButtonBar()

    return <StyledProfile
      id="new-pin"
    >
      {prompt}
      {buttonBar}
    </StyledProfile>
  }
}



export default withTracker(() => {
  const phraseQuery = {
   $or: [
      { cue: "remember_pin" }
    , { cue: "pin_reason" }
    , { cue: "pin_memorized" }
    ]
  }
  const phrases = L10n.find(phraseQuery).fetch()

  return {
    phrases
  }
})(NewPIN)
