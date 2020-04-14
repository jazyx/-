import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../api/collections'




class Pointers extends Component {
  constructor(props) {
    super(props)
  }


  render() {
    return <div
      id="pointers"
    >
    </div>
  }
}



export default withTracker(() => {
  const collection  = collections["Groups"]
  Meteor.subscribe(collection._name)

  const _id = Session.get("group_id")
  const query = { /* Get pointer data */ }
  const pointers = [] // collection.find(query).fetch()

  return {
    pointers
  }
})(Pointers)
