import React, { Component } from 'react';

import Connect from './Connect.jsx';
import Activity from './Activity.jsx';
import Menu from './Menu.jsx';
import Game from './Game.jsx';


export class App extends Component {
  constructor(props) {
    super(props)
    this.views = {
       Connect
    ,  Activity
    ,  Game
    }

    this.state = { view: "Connect" }

    this.setView = this.setView.bind(this)
  }


  setView(view) {
    if (this.views[view]) {
      this.setState({ view })
    } else {
      console.log("Unknown view:", view)
    }
  }


  render() {
    const View = this.views[this.state.view]

    return <div id="wrapper">
      <View
        setView={this.setView}
      />
      <Menu
        hide={this.state.view === "Connect"}
      />
    </div>
    
  }
}
