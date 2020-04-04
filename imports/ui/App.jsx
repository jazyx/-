import React, { Component } from 'react';
import Connect from './Connect.jsx';
import Game from './Game.jsx';

export class App extends Component {
  constructor(props) {
    super(props)
    this.views = {
      "Connect": Connect
    , "Game": Game
    }

    this.state = { view: "Connect" }

    this.setView = this.setView.bind(this)
  }


  setView(view) {
    if (this.views[view]) {
      this.setState({ view })
    }
  }


  render() {
    const props = { setView: this.setView }
    const children = []
    const element = this.views[this.state.view]

    return React.createElement(
      element
    , props
    , children
    )
  }
}
