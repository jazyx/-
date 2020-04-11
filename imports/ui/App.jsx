 import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import Connect from './Connect.jsx';
import Menu from './Menu.jsx';
import ShareScreen from './ShareScreen.jsx';
import Activity from './activities/Activity.jsx';

// ADD NEW ACTIVITIES HERE...
import Drag from './activities/Drag.jsx';
import Mimo from './activities/Mimo.jsx';


export class App extends Component {
  constructor(props) {
    super(props)
    // ... AND HERE:
    this.views = {
      Connect
    , Activity
    , ShareScreen
    , Drag
    , Mimo
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
