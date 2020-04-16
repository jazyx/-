import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../api/collections'




class Chat extends Component {
  constructor(props) {
    super(props)
  }


  render() {
    return <div
      id="chat"
    >
    </div>
  }
}



export default withTracker(() => {
  // const collection  = collections["Chat"]
  // Meteor.subscribe(collection._name, "Chat")

  const _id = Session.get("group_id")
  const query = { /* Get message data for this group and admin */ }
  const messages = [] // collection.find(query).fetch()

  return {
    messages
  }
})(Chat)
