import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../../api/collections'
import { localize
       , getElementIndex
       } from '../../tools/utilities'
import { log } from '../../api/methods'

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

    this.logTeacherIn()

    // Allow Enter to accept the default/current language
    document.addEventListener("keydown", this.share, false)
    window.addEventListener("resize", this.scrollIntoView, false)
  }


  logTeacherIn() {
    const id = Session.get("teacher_id")
    log.call({ id, in: true }) // no callback
  }


  share(event) {
    if (event && event.type === "keydown" && event.key !== "Enter") {
      return
    } else if (!this.state.selected < 0) {
      return
    }

    const group = this.props.groups[this.state.selected]
    const { _id, view } = group
    Session.set("group_id", _id)
    this.props.setView(view)
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


  getGroups() {
    const groups = this.props.groups.map((group, index) => {
      // {
      //   _id: "ZG9N9SuWwgNTzpgXH"
      // , user_names: [
      //     "Ирина"
      //   , "Влад"
      //   ]
      // , loggedIn: ["XSK5wZtMWriW8Tuba"]
      // , master:    "XSK5wZtMWriW8Tuba"
      // , user_ids: [
      //     "XSK5wZtMWriW8Tuba"
      //   , "y6sQmtm5DGqE27S95"
      //   ]
      // }
      const name = group.name || group.user_names[0]
      const selected = this.state.selected === index
      const ref = selected ? this.scrollTo : ""
      const disabled = !group.loggedIn.length

      return <StyledLearner
        key={name}
        ref={ref}
        disabled={disabled}
        selected={selected}
        onMouseUp={this.toggleLearner}
      >
        {name}
      </StyledLearner>
    })

    return <StyledUL>{groups}</StyledUL>
  }


  getButtonBar() {
    const disabled = ( this.state.selected < 0 )
                   || !this.props.groups[this.state.selected]
                                        .loggedIn.length
    const name = disabled
               ? undefined
               : this.props.groups[this.state.selected].group_name
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
    const groups = this.getGroups()
    const buttonBar = this.getButtonBar()

    return <StyledProfile
      id="teacher"
    >
      {prompt}
      {groups}
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
  const Groups  = collections["Groups"]
  Meteor.subscribe(Groups._name)

  const groupQuery = { teacher_id: Session.get("teacher_id") }
  const project    = {
    user_ids: 1
  , master: 1
  , loggedIn: 1
  , view: 1
  }
  // console.log(
  //   "db.groups.find("
  // , JSON.stringify(groupQuery)
  // , ","
  // , JSON.stringify(project)
  // , ").pretty()"
  // )
  let groups       = Groups.find(groupQuery, {fields: project})
                           .fetch()
                           .sort((a, b) => (
                              b.loggedIn.length - a.loggedIn.length
                            ))
  const user_ids   = groups.reduce(
    (ids, group) => {
      return [...ids, ...group.user_ids]
    }
  , []
  )

  const Users  = collections["Users"]
  Meteor.subscribe(Users._name)
  const users = Users.find(
    { _id: { $in: user_ids } }
  , { sort: [[ "loggedIn", "desc" ], [ "username", "asc" ]] }
  ).fetch()

  groups = groups.map(group => {
    group.user_names = group.user_ids.map(id => (
      users.find(user => user._id === id))
           .username
    )

    if (!group.group_name) {
      group.group_name = group.user_names[0]
    }

    return group
  })

  // console.log(groups)

  const props = {
    phrases
  , groups
  , users
  }

  return props
})(Teach)
