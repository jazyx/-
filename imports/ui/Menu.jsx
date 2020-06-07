/**
 * /imports/ui/Menu.jsx
 *
 * The Menu consists of three parts:
 * 1. A full-height background that slides in and out
 * 2. A list of clickable item that is a child of the background
 * 3. A hamburger icon which:
 *    • Is always visible
 *    • Slides out in sync with the background when the background's
 *      right edge is flush with the icon's right edge
 *    • Slides back in in sync with the background, until the
 *      background's right edge is less than the icon's width
 *    • Becomes semi-transparent when the background is not showing
 *    • Brightenes to full opacity when the background slides out
 * Clicking on the hamburger icon makes the background slide out or
 * back in again. Clicking anywhere outside the background while it
 * is visible will make it slide back in again.
 *
 * Clicking on on of the clickable items in the list will trigger
 * that item and slide the menu back in.
 */


import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data'

import styled, { css } from 'styled-components'
import { Session } from 'meteor/session'

import Storage from '../tools/storage'
import { logOut } from '../api/methods/methods'


const colors = {
  fillColor: "#fff"
, strokeColor: "#000"
, menu: "rgba(0,0,0,0.8)"
}


const StyledControls = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1;
  text-align: left;
`


const StyledSVG = styled.svg`
  position: fixed;
  width: 15vmin;
  height: 15vmin;
  fill: ${colors.fillColor};
  stroke: ${colors.strokeColor};
  opacity: ${props => (
    props.open ? 1 : (props.over ? 0.75 : 0.25)
  )};
  top: 0;
  left: ${props => props.open ? "27vmin" : 0};
  transition: left .27s linear, opacity .15s;
  transition-property: left, opacity;
  transition-delay: ${props => props.open ? ".15s,0s;" : "0s,.27s;"}
`


const StyledMenu = styled.div`
  position: fixed;
  box-sizing: border-box;
  top: 0;
  left: ${props => props.open ? 0 : "-42vmin"};
  ${props => props.open
          ? "box-shadow: 0 0 3vmin 0 rgba(0,0,0,0.75);"
          : ""
  }
  height: 100vh;
  width: 42vmin;
  padding: 2vmin;
  padding-top: 18vmin;
  background-color: ${colors.menu};

  transition: left .42s linear;
`


const StyledSubset = styled.div`
  margin: 2vmin 0 0 6vmin;
`




const Items = (props) => {
  const menuItems = props.path.map(item => (
    <p
      key={item}
    >
      {item}
    </p>
  ))

  return <StyledMenu
    ref={props.pane}
    open={props.open}
  >
    {menuItems}
  </StyledMenu>

}


const Icon = () => (
  <g className="menu">
    <path d="
      M5,20
      L5,80
      H95
      L95,20
      z" opacity="0" />
    <path d="
      M15,10
      H85
      a 10 10 180 0 1 0 20
      H15
      a 10 10 180 0 1 0 -20
      z" />
    <path d="
      M15,40
      H85
      a 10 10 180 0 1 0 20
      H15
      a 10 10 180 0 1 0 -20
      z" />
    <path d="
      M15,70
      H85
      a 10 10 180 0 1 0 20
      H15
      a 10 10 180 0 1 0 -20
      z" />
  </g>
)



class Menu extends Component {
  constructor(props) {
    super(props)

    this.pane = React.createRef()

    this.callback = props.callback // <<<<<

    this.openMenu = this.openMenu.bind(this)
    this.closeMenu = this.closeMenu.bind(this)
    this.toggleOver = this.toggleOver.bind(this)
    this.state = { open: true }

    this.logOut = this.logOut.bind(this)
    window.addEventListener("beforeunload", this.logOut, false)

    this.openMenu()
  }


  openMenu(event) {
    if (this.ignoreOpen) {
      return
    }
    if (event) {
      this.setState({ open: true })
    }

    const listener = this.closeMenu
    document.body.addEventListener("touchstart", listener, true)
    document.body.addEventListener("mousedown", listener, true)
  }


  closeMenu(event) {
    // Check if the click was inside the slide-out menu. If not,
    // close the menu

    if (event.type === "touchstart") {
      // Prevent the mouseup from firing right behind
      this.timeout = setTimeout(() => this.timeout = 0, 300)
    } else if (this.timeout) {
      return
    }

    const pane = this.pane.current
    if (pane&& !pane.contains(event.target)) {
      this.setState({ open: false })

      // Prevent the menu from reopening immediately if the click to
      // close was on the Icon

      this.ignoreOpen = true
      setTimeout(() => this.ignoreOpen = false, 100)

      const listener = this.closeMenu
      document.body.removeEventListener("touchstart", listener, true)
      document.body.removeEventListener("mousedown", listener, true)
    }
  }


  toggleOver(event) {
    const over = (event.type === "mouseenter")
    this.setState({ over })
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

    // const group_id = Session.get("group_id")
    const userAndDevice = { id, d_code } //, group_id }

    logOut.call(userAndDevice) // no callback = synchronous
  }


  render() {
    if (this.props.hide) {
      return ""
    }

    return <StyledControls
        id="Controls"
      >
        <Items
          pane={this.pane}
          open={this.state.open}
          path={this.props.path}
        />
        <StyledSVG
          id="openMenu"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"

          open={this.state.open}
          over={this.state.over}

          onClick={this.openMenu}
          onMouseEnter={this.toggleOver}
          onMouseLeave={this.toggleOver}
        >
          <Icon />
        </StyledSVG>
      </StyledControls>
  }
}



export default withTracker(() => {
  const props = {
    path: ["Drag", "home", "kitchen"]
  }

  return props
})(Menu)