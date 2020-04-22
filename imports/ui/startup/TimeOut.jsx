/**
 * /imports/ui/startup/TimeOut.jsx
 * 
 * The Menu will be active, but it won't be possible to use it much.
 * 
 * TODO: Add active buttons for Try Again, Wait and [Continue], which
 * will only become active if the non-activity collections eventually
 * become ready.
 */


import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { StyledProfile
       , StyledPrompt
       } from '../styles'




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
      <button>Try Again</button>
    </StyledProfile>
  }
}