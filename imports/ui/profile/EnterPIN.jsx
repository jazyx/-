import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { L10n } from '../../api/collections'
import { localize } from '../../tools/utilities'

import { StyledProfile
       , StyledPrompt
       , StyledInput
       , StyledP
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './styles'




class EnterPIN extends Component {
  constructor(props) {
    super(props)

    this.state = { q_code: Session.get("q_code") || ""}

    this.submit = this.submit.bind(this)
    this.editPIN = this.editPIN.bind(this)
    this.createAccount = this.createAccount.bind(this)
  }


  editPIN(event) {
    const q_code = event.target.value

    if (q_code.length > 4) {
      event.target.value = this.state.q_code
      return
    }

    this.setState({ q_code })
  }


  submit(event) {
    if (event.type === "keydown") {
      if (event.key !== "Enter") {
        return
      } else if (this.state.q_code.length !== 4) {
        event.preventDefault()
        return
      }
    }

    event.preventDefault()
    Session.set("q_code", this.state.q_code)
    Session.set("pin_given", true)

    this.props.setView("Submit")
  }


  createAccount() {
    Session.set("status", "CreateAccount")
    this.props.setView("Submit")
  }


  getPrompt() {
    const code = Session.get("native")
    let prompt = localize("enter_pin", code, this.props.phrases)

    if (Session.get("pin_given")) {
      // The user already entered one 4-digit PIN, but this was not
      // accepted. Show an error warning.

      prompt = <span>
        <span
          style={{ color: "#900" }}
        >
          {localize("wrong_pin", code, this.props.phrases)}
        </span><br />
        <span>{prompt}</span>
      </span>
    }

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  getPINInput() {
    return <StyledInput
      onKeyUp={this.editPIN}
      onKeyDown={this.submit}
      autoFocus={true}
    />
  }


  getHint() {
    const cue = "no_pin"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledP>
      {prompt}
    </StyledP>
  }


  getCreateAccountButton() {
    const cue = "create_account"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledButton
      onMouseUp={this.createAccount}
    >
      {prompt}
    </StyledButton>
  }


  getButtonBar() {
    const cue = "log_in"
    const code = Session.get("native")
    const options = { "^0": Session.get("username") }
    const prompt = localize(cue, code, this.props.phrases, options)
    const disabled = this.state.q_code.length !== 4

    return <StyledButtonBar>
      <StyledNavArrow
        way="back"
        invisible={true}
      />
      <StyledButton
        disabled={disabled}
        onMouseUp={this.submit}
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
    const input = this.getPINInput()
    const hint = this.getHint()
    const createAccount = this.getCreateAccountButton()
    const buttonBar = this.getButtonBar()

    return <StyledProfile
      id="enter-pin"
    >
      {prompt}
      {input}
      {hint}
      {createAccount}
      {buttonBar}
    </StyledProfile>
  }
}



export default withTracker(() => {
  const phraseQuery = {
   $or: [
      { cue: "enter_pin" }
    , { cue: "wrong_pin" }
    , { cue: "no_pin" }
    , { cue: "create_account" }
    , { cue: "log_in" }
    ]
  }
  const phrases = L10n.find(phraseQuery).fetch()

  return {
    phrases
  }
})(EnterPIN)
