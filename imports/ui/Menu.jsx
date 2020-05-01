import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import styled, { css } from 'styled-components'
import { Session } from 'meteor/session'

import Storage from '../tools/storage'
import { logOut } from '../api/methods/methods'



const StyledMenu = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: calc(25 * var(--min));
  height: calc(100 * var(--h));
  background-color: #f00;
  opacity: 0.1;

  pointer-events: none;
`

let instance = 0


export default class Menu extends Component {
  constructor(props) {
    super(props)

    // console.log("Menu instance:", instance += 1)

    this.logOut = this.logOut.bind(this)
    window.addEventListener("beforeunload", this.logOut, false)
  }


  logOut() {
    // The user may be both a teacher and a learner. The user_id
    // for a learner may have been read in from localStorage, but
    // the teacher_id is not stored, so if it is present, this
    // user logged in as a teacher.

    const id = Session.get("teacher_id") || Session.get("user_id")
    const d_code = Session.get("d_code")

    if (!(id && d_code)) {
      // id and d_code will not be set unless basic profile is
      // completed on first use of this device or after localStorage
      // has been disabled

      return
    }

    const group_id = Session.get("group_id")

    if (Session.get("role") === "teacher") {
      // HACK: Create a single-use Session variable so that when a
      // Teacher logs out, Share does log them back in again
      Session.set("loggingOut", true)
    }

    const userAndDevice = { id, group_id, d_code }

    logOut.call(userAndDevice) // no callback = synchronous
  }


  render() {
    if (this.props.hide) {
      return ""
    }

    return <StyledMenu
      id="menu"
    />
  }
}
