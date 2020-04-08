import React, { Component } from 'react';
import styled, { css } from 'styled-components'


const StyledMenu = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 25vmin;
  height: 100vh;
  background-color: #fff;
  opacity: 0.01;

  pointer-events: none;
`


export default class Menu extends Component {
  constructor(props) {
    super(props)
  }


  render() {
    if (this.props.hide) {
      return ""
    }

    return <StyledMenu />
  }
}
