
import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { L10n
       , Teachers
       } from '../../api/collections'
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
       } from './styles'




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
        aspectRatio={this.props.aspectRatio}
      >
        <img src={flag} alt={code} className="flag" />
        <p>{name}</p>
      </StyledTeacher>
    })

    return <StyledUL
      aspectRatio={this.props.aspectRatio}
    >
      {blocks}
    </StyledUL>
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
      setTimeout(this.scrollIntoView, 1000) // <<< HARD-CODED
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
  const phraseSelect = {
    $or: [
      { cue: "choose_teacher" }
    , { cue: "next" }
    ]
  }
  const folderSelect = { folder: { $exists: 1 } }
  const flagSelect  = {
    file: { $exists: true }
  }
  const flagProjection = { cue: 1, file: 1, _id: 0 }
  const phrases = L10n.find(phraseSelect).fetch()
  const flags = L10n.find(flagSelect, flagProjection).fetch()
  const flagsFolder = L10n.findOne(folderSelect)

  // Teacher profiles
  const teacherSelect = { type: { $eq: "profile" }}
  const teachers = Teachers.find(teacherSelect).fetch()
  const teachersFolder = Teachers.findOne(folderSelect)

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
