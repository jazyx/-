import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'
import styled, { css } from 'styled-components'

import collections from '../api/collections'
import { localize } from '../tools/utilities'



const StyledScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`

const StyledTEMP = styled.h1`
  text-align: center;
  opacity: 0.2;
`




class ShareScreen extends Component {
  constructor(props) {
    super(props)

    this.state = { ready: false }
  }


  getPrompt() {
    const code = Session.get("native")
    const prompt = localize("shared_screen", code, this.props.phrases)

    return <StyledTEMP>
      {prompt}
    </StyledTEMP>
  }


  //// SHOW SHARED SCREEN ////

  //// SHOW EXIT BUTTO UNTIL MENU IS READY ///


  render() {
    const prompt = this.getPrompt()

    return <StyledScreen
      id="shared"
    >
      {prompt}
    </StyledScreen>
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
})(ShareScreen)
