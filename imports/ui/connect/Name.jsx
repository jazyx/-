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




class Name extends Component {
  constructor(props) {
    super(props)

    const username = Session.get("username") || ""
    this.state = { username }

    this.input = React.createRef()
    this.editUserName = this.editUserName.bind(this)
    this.setUserName = this.setUserName.bind(this)
  }


  editUserName(event) {
    const username = this.input.current.value
    this.setState({ username })
  }


  setUserName(event) {
    if (!this.state.username) {
      return
    }

    if (event.type === "keydown") {
      if (event.keyCode !== 13) {
        return
      }
    }

    event.preventDefault()
    Session.set("username", this.state.username)

    this.props.setView("Learning")
  }


  getPrompt() {
    const cue = "enter_name"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  getInput() {
    const cue = "username"
    const code = Session.get("native")
    const placeholder = localize(cue, code, this.props.phrases)

    return <StyledInput
      type="text"
      ref={this.input}
      value={this.state.username}
      placeholder={placeholder}
      onChange={this.editUserName}
      onKeyDown={this.setUserName}
      autoFocus={true}
    />
  }


  getButtonBar() {
    const cue = "next"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)
    const disabled = !Session.get("learning")

    console.log("Name > Learnig disabled", disabled, "learning:", Session.get("learning"))

    return <StyledButtonBar>
      <StyledNavArrow
        way="back"
        disabled={false}
        onMouseUp={() => this.props.setView("Native")}
      />
      <StyledButton
        disabled={!this.state.username}
        onMouseUp={this.setUserName}
      >
        {prompt}
      </StyledButton>
      <StyledNavArrow
        way="forward"
        disabled={disabled}
        onMouseUp={() => this.props.setView("Learning")}
      />
    </StyledButtonBar>
  }


  render() {
    const prompt = this.getPrompt()
    const input  = this.getInput()
    const buttonBar = this.getButtonBar()

    return <StyledProfile
      id="user-name"
    >
      {prompt}
      {input}
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
  const phrases     = collection.find(phraseQuery).fetch()

  return {
    phrases
  }
})(Name)
