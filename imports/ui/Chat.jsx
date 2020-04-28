import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { Chat } from '../api/collections'




class Chatter extends Component {
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
  const _id = Session.get("group_id")
  const select = { /* Get message data for this group and admin */ }
  const messages = [] // Chat.find(select).fetch()

  return {
    messages
  }
})(Chatter)
