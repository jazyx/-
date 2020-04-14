import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import styled, { css } from 'styled-components'
import { Session } from 'meteor/session'

import Storage from '../tools/storage'
import { log } from '../api/methods.js';




const StyledMenu = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 25vmin;
  height: 100vh;
  background-color: #fff;
  opacity: 0.05;

  pointer-events: none;
`


export default class Menu extends Component {
  constructor(props) {
    super(props)

    this.logOut = this.logOut.bind(this)
    window.addEventListener("beforeunload", this.logOut, false)
  }


  logOut() {
    // The user may be both a teacher and a learner. The user_id
    // for a learner may have been read in from localStorage, but
    // the teacher_id is not stored, so if it is present, this
    // user logged in as a teacher.
    const id = Session.get("teacher_id") || Session.get("user_id")
    if (!id) {
      return
    }

    const logOut = { id, in: false }
    log.call(logOut) // no callback because app is closing
  }


  render() {
    if (this.props.hide) {
      return ""
    }

    return <StyledMenu />
  }
}
