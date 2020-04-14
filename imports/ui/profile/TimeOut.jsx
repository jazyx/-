import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { StyledProfile
       , StyledPrompt
       } from './Styles'




export default class TimeOut extends Component {

  getPrompt() {
    const phrases = {
      "ru": "Нет соединения"
    , "en": "No connection"
    , "fr": "Pas de connexion"
    }
    const code = navigator.language.replace(/-.*/, "")
    const prompt = phrases[code] || phrases.en

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  render() {
    const prompt = this.getPrompt()

    return <StyledProfile
      id="time-out"
    >
      {prompt}
    </StyledProfile>
  }
}