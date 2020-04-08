import React, { Component } from 'react';


export default class Activity extends Component {
  constructor(props) {
    super(props)
  }


  setView(view) {
    if (this.views[view]) {
      this.setState({ view })
    }
  }


  render() {

    return <h1>Activity</h1>
  }
}
