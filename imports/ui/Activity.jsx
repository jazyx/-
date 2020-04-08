import React, { Component } from 'react'

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../api/collections'
import { localize } from '../core/utilities'

import { StyledProfile
       , StyledPrompt
       , StyledActivity
       , StyledActivities
       , StyledDescription
       , StyledButton
       } from './activities/Styles'



class Activity extends Component {
  constructor(props) {
    super(props)

    this.state = { selected: 3 }
    this.goActivity = this.goActivity.bind(this)
  }


  goActivity() {

  }


  getPhrase(cue, corpus) {  
    const map  = corpus[cue]
    let code = Session.get("native")
    let phrase = map[code]

    if (!phrase) {
      code = code.replace(/-.*/, "")
      phrase = map[code]

      if (!phrase) {
        phrase = "***" + cue + "***"
      }
    }

    return phrase
  }


  getPrompt() {
    const code = Session.get("native")
    const prompt = localize("activities", code, this.props.phrases)

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  getActivities() {
    const activities = this.props.activities.map(activity => {
      const src         = activity.folder + activity.icon
      const name        = this.getPhrase("name", activity)
      const description = this.getPhrase("description", activity)

      console.log(name)

      return <StyledActivity
        key={name}
        src={src}
      >
        <p>{name}</p>
      </StyledActivity>
    })
    return <StyledActivities>{activities}</StyledActivities>
  }


  getDescription() {
    let description = ""
    if (this.state.selected) {
      const activity = this.props.activities[this.state.selected]
      description = this.getPhrase("description", activity) 
    }

    return <StyledDescription>
      {description}
    </StyledDescription>
  }


  getButton() {
    const disabled = false
    const code = Session.get("native")
    const prompt = localize("start", code, this.props.phrases)

   return <StyledButton
      disabled={disabled}
      onMouseUp={this.goActivity}
    >
      {prompt}
    </StyledButton>
  }


  render() {
    const prompt = this.getPrompt()
    const activities = this.getActivities()
    const description = this.getDescription()
    const button = this.getButton()

    return <StyledProfile
      id="activities"
    >
      {prompt}
      {activities}
      {description}
      {button}
    </StyledProfile>
  }
}


export default withTracker(() => {
  // Phrases
  const l10n  = collections["L10n"]
  Meteor.subscribe(l10n._name)

  const phraseQuery = {
    $and: [
      { type: { $eq: "phrase" }}
    , { file: { $exists: false }}
    ]
  }
  const phrases = l10n.find(phraseQuery).fetch()


  // Activities
  const collection  = collections["Activities"]
  Meteor.subscribe(collection._name)

  const activityQuery = {}
  const activities = collection.find(activityQuery).fetch()

  const props = {
    phrases
  , activities
  }

  return props
})(Activity)