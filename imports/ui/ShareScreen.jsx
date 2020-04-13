import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'
import styled, { css } from 'styled-components'

import collections from '../api/collections'
import Share from '../tools/share'
import { localize } from '../tools/utilities'

// ADD NEW ACTIVITIES HERE...
import Activity from './activities/Activity.jsx';
import Drag from './activities/Drag.jsx';
import Mimo from './activities/Mimo.jsx';




const StyledScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`



class ShareScreen extends Component {
  constructor(props) {
    super(props)

    this.views = {
      Activity
    , Drag
    , Mimo
    }
  }


  setView(view) {
    if (this.views[view]) {
      this.setState({ view })
    } else {
      console.log("Unknown view:", view)
    }
  }


  //// SHOW EXIT BUTTON UNTIL MENU IS READY ///


  render() {
    const View = this.views[this.props.view] // {this.props.view}

    // console.log("ShareScreen props:", this.props)

    return <StyledScreen
      id="SharedScreen"
    >
      <View
        units={this.props.units}
      />
    </StyledScreen>
  }
}



export default withTracker(() => {
  const props = Share.get()

  // console.log("ShareScreen props update", props)

  return props
})(ShareScreen)