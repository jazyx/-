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
       , StyledTeacher
       , StyledUL
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './Styles'




class Teacher extends Component {
  constructor(props) {
    super(props)

    this.ids = this.props.teachers.map(profile => profile.id)
    this.state = { selected: Session.get("teacher") }

    this.scrollTo = React.createRef()

    this.setTeacher = this.setTeacher.bind(this)
    this.selectTeacher = this.selectTeacher.bind(this)
    this.scrollIntoView = this.scrollIntoView.bind(this)

    // Allow Enter to accept the default/current language
    document.addEventListener("keydown", this.setTeacher, false)
    window.addEventListener("resize", this.scrollIntoView, false)
  }


  setTeacher(event) {
    if (event && event.type === "keydown" && event.key !== "Enter") {
      return
    } else if (!this.state.selected) {
      return
    }

    const profile = this.getProfile()
    Session.set("language", profile.language)
    Session.set("teacher", this.state.selected)

    this.props.setView("Submit")
  }


  selectTeacher(event) {
    const selected = event.target.id
    if (selected === this.state.selected) {
      // A second click = selection
      return this.setTeacher()
    }

    this.setState({ selected })
    this.scrollFlag = true // move fully onscreen if necessary
  }


  getPhrase(cue) {
    const code = Session.get("native")
    return localize(cue, code, this.props.phrases)
  }


  getProfile() {
    return this.props.teachers.find(profile => (
      profile.id === this.state.selected
    ))
  }


  scrollIntoView() {
    const element = this.scrollTo.current
    if (element) {
      element.scrollIntoView({behavior: 'smooth'})
    }
  }


  getPrompt() {
    const prompt = this.getPhrase("choose_teacher")

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  getProfileBlocks() {
    const folders = this.props.folders
    const flags   = this.props.flags

    const blocks = this.props.teachers.map((profile, index) => {
      const src = folders.teachers + profile.file

      const code = profile.language
      const flagData = flags.find(document => document.cue === code)
      const flag = folders.flags + flagData.file

      const name = profile.name[profile.script]
      const id = profile.id
      const selected = id === this.state.selected
      const ref = selected ? this.scrollTo : null

      return <StyledTeacher
        id={id}
        className="profile"
        key={name}
        ref={ref}
        src={src}
        selected={selected}
        onMouseUp={this.selectTeacher}
      >
        <img src={flag} alt={code} className="flag" />
        <p>{name}</p>
      </StyledTeacher>
    })

    return <StyledUL>{blocks}</StyledUL>
  }


  getButtonPrompt() {
    let prompt
    if (this.state.selected) {
      const profile = this.getProfile()
      prompt = profile.with

    } else {
      prompt = this.getPhrase("next")
    }

    return prompt
  }


  getButtonBar() {
    const prompt = this.getButtonPrompt()
    const disabled = !this.state.selected

    return <StyledButtonBar>
      <StyledNavArrow
        way="back"
        disabled={false}
        onMouseUp={() => this.props.setView("Name")}
      />
      <StyledButton
        disabled={disabled}
        onMouseUp={this.setTeacher}
      >
        {prompt}
      </StyledButton>
      <StyledNavArrow
        way="forward"
        disabled={false}
        onMouseUp={() => this.props.setView("Activity")}
      />
    </StyledButtonBar>
  }


  render() {
    const prompt = this.getPrompt()
    const blocks = this.getProfileBlocks()
    const buttonBar = this.getButtonBar()

    return <StyledProfile
      id="teacher"
      onMouseUp={this.props.points}
      onMouseDown={this.props.points}
      onTouchStart={this.props.points}
      onTouchEnd={this.props.points}
    >
      {prompt}
      {blocks}
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
    document.removeEventListener("keydown", this.setTeacher, false)
  }
}



export default withTracker(() => {
  // Phrases and flags
  const l10n  = collections["L10n"]
  Meteor.subscribe(l10n._name)

  const phraseQuery = {
    $and: [
      { type: { $eq: "phrase" }}
    , { file: { $exists: false }}
    ]
  }
  const folderQuery = { folder: { $exists: 1 } }
  const flagQuery  = {
    $and: [
      { file: { $exists: true } }
    , { file: { $ne: "xxxx"} }
    ]
  }
  const flagProjection = { cue: 1, file: 1, _id: 0 }
  const phrases = l10n.find(phraseQuery).fetch()
  const flags = l10n.find(flagQuery, flagProjection).fetch()
  const flagsFolder = l10n.findOne(folderQuery)

  // Teacher profiles
  const collection = collections["Teachers"]
  const teacherQuery = { type: { $eq: "profile" }}
  const teachers = collection.find(teacherQuery).fetch()
  const teachersFolder = collection.findOne(folderQuery)

  // Folder paths
  const folders = {
    teachers: teachersFolder ? teachersFolder.folder : ""
  , flags:    flagsFolder    ? flagsFolder.folder    : ""
  }

  const props = {
    phrases
  , flags
  , teachers
  , folders
  }

  return props
})(Teacher)
