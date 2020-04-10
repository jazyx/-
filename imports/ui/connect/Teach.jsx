import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import User from '../../api/User'
import collections from '../../api/collections'
import { localize
       , getElementIndex
       } from '../../tools/utilities'

import { StyledProfile
       , StyledPrompt
       , StyledUL
       , StyledLearner
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './Styles'




class Teach extends Component {
  constructor(props) {
    super(props)

    this.state = { selected: -1 }

    this.scrollTo = React.createRef()

    this.share = this.share.bind(this)
    this.toggleLearner = this.toggleLearner.bind(this)
    this.scrollIntoView = this.scrollIntoView.bind(this)

    // Allow Enter to accept the default/current language
    document.addEventListener("keydown", this.share, false)
    window.addEventListener("resize", this.scrollIntoView, false)
  }


  share(event) {
    if (event && event.type === "keydown" && event.key !== "Enter") {
      return
    } else if (!this.state.selected < 0) {
      return
    }

    this.props.setView("ShareScreen")
  }


  toggleLearner(event) {
    const selected = getElementIndex(event.target, "UL")
    if (selected === this.state.selected) {
      // A second click = selection
      return this.share()
    }

    this.setState({ selected })
    this.scrollFlag = true // move fully onscreen if necessary

  }


  getPhrase(cue, name) {
    const code = Session.get("native")
    if (name) {
      name = {"^0": name.replace(" ", "\xA0")} // non-breaking space
    }
    return localize(cue, code, this.props.phrases, name)
  }


  scrollIntoView() {
    const element = this.scrollTo.current
    if (element) {
      element.scrollIntoView({behavior: 'smooth'})
    }
  }


  getPrompt() {
    const prompt = this.getPhrase("select_students")

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  getLearners() {
    const learners = this.props.learners.map((profile, index) => {
      const name = profile.username
      const selected = this.state.selected === index
      const ref = selected ? this.scrollTo : ""

      return <StyledLearner
        key={name}
        ref={ref}
        selected={selected}
        onMouseUp={this.toggleLearner}
      >
        {name}
      </StyledLearner>
    })

    return <StyledUL>{learners}</StyledUL>
  }


  getButtonBar() {
    const disabled = this.state.selected < 0
    const name = disabled
               ? undefined
               : this.props.learners[this.state.selected].username
    const prompt = this.getPhrase("share", name)

    return <StyledButtonBar>
      <StyledNavArrow
        invisible={true}
      />
      <StyledButton
        disabled={disabled}
        onMouseUp={this.share}
      >
        {prompt}
      </StyledButton>
      <StyledNavArrow
        invisible={true}
      />
    </StyledButtonBar>
  }


  render() {
    const prompt = this.getPrompt()
    const learners = this.getLearners()
    const buttonBar = this.getButtonBar()

    return <StyledProfile
      id="teacher"
    >
      {prompt}
      {learners}
      {buttonBar}
    </StyledProfile>
  }


  componentDidMount(delay) {
    // HACK: Not all images may have been loaded from MongoDB, so
    // let's wait a little before we scrollIntoView
    setTimeout(this.scrollIntoView, 200)
  }


  componentDidUpdate() {
    if (this.scrollFlag) {
      this.scrollIntoView()
      this.scrollFlag = false
    }
  }


  componentWillUnmount() {
    window.removeEventListener("resize", this.scrollIntoView, false)
    document.removeEventListener("keydown", this.share, false)
  }
}



export default withTracker(() => {
  // Phrases
  const l10n  = collections["L10n"]
  Meteor.subscribe(l10n._name)

  const phraseQuery = {
    $and: [
      { type: { $eq: "phrase" }}
    , { file: { $exists: false }} // no flags
    ]
  }
  const phrases = l10n.find(phraseQuery).fetch()

  // Groups
  const groups  = collections["Groups"]
  Meteor.subscribe(groups._name)

  const groupQuery  = { teacher_id: Session.get("teacher_id") }
  const projection  = { learner_ids: 1, _id: 0 }
  const learner_ids = groups.find(groupQuery, projection)
                            .fetch()
                            .reduce((ids, group) => {
                              return [...ids, ...group.learner_ids]
                            }, [])

  // Learners
  const users  = collections["Users"]
  Meteor.subscribe(users._name)
  const learners = users.find({ _id: { $in: learner_ids }}).fetch()

  const props = {
    phrases
  , learners
  }

  return props
})(Teach)
