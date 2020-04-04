import React, { Component } from 'react';
import styled, { css } from 'styled-components'


export default class Connect extends Component {
  render() {
    return <div>
      <h1>Connect</h1>
      <button
        onMouseUp={() => this.props.setView("Game")}
      >
        Start Game
      </button>
    </div>
  }
}