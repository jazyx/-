import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';
import styled, { css } from 'styled-components'

// Throbber code by Daria Koutevska
// Licence: MIT
// Source:  https://codepen.io/DariaIvK/details/EpjPRM

const StyledSplash = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;

  & .lds-ring {
    display: inline-block;
    position: relative;
    width: 64px;
    height: 64px;
  }
  & .lds-ring div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 51px;
    height: 51px;
    margin: 6px;
    border: 6px solid #cef;
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: #fff transparent transparent transparent;
  }
  & .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }
  & .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }
  & .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }
  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
 `


export default class Slash extends Component {
  render() {
    return <StyledSplash>
      <div className="lds-ring">
        <div></div><div></div><div></div><div></div>
      </div>
    </StyledSplash>
  }
}
