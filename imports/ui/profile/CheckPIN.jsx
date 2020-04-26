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




class CheckPIN extends Component {
  constructor(props) {
    super(props)

    this.start = this.start.bind(this)
    document.addEventListener("keydown", this.start, false)
  }


  start(event) {
    if (event && event.type === "keydown" && event.key !== "Enter") {
      return
    } else if (!this.state.selected) {
      return
    }

    this.props.setView("Activity")
  }


  getPrompt() {
    const cue = "learn_pin"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  getPIN() {
    return <StyledPrompt>
      {Session.get("code")}
    </StyledPrompt>
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
        onMouseUp={this.start}
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
      id="check-pin"
    >
      {prompt}
      {buttonBar}
    </StyledProfile>
  }
}



export default withTracker(() => {
  const phraseQuery = {
   $or: [
      { cue: "learn_pin" }
    , { cue: "pin_memorized" }
    ]
  }
  const phrases = L10n.find(phraseQuery).fetch()

  return {
    phrases
  }
})(CheckPIN)
