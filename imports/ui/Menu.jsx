import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import styled, { css } from 'styled-components'
import { Session } from 'meteor/session'




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
    document.addEventListener("onbeforeunload", this.logOut, false)
  }


  logOut() {

  }


  render() {
    if (this.props.hide) {
      return ""
    }

    return <StyledMenu />
  }
}
