import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections from '../../api/collections'
import { localize } from '../../core/utilities'

import { StyledProfile
       , StyledPrompt
       , StyledFlags
       , StyledLI
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './Styles'


class Native extends Component {
  constructor(props) {
    super(props)
    const codes = this.codes = this.props.flags.map(flag => flag.cue)
    const code  = Session.get("native") || this._getDefaultCode()
    const selected = codes.indexOf(code)

    this.scrollTo = React.createRef()
    this.state = { selected, hover: -1 }

    this.selectLanguage     = this.selectLanguage.bind(this)
    this.selectFlag         = this.selectFlag.bind(this)
    this.mouseEnter         = this.mouseEnter.bind(this)
    this.mouseLeave         = this.mouseLeave.bind(this)
    this.scrollFlagIntoView = this.scrollFlagIntoView.bind(this)

    // Allow Enter to accept the default/current language
    document.addEventListener("keydown", this.selectLanguage, false)
    window.addEventListener("resize", this.scrollFlagIntoView, false)
  }


  _getDefaultCode() {
    let code = navigator.language        // "co-DE"
    let index = this.codes.indexOf(code)

    if (index < 0) {
      code = code.replace(/-\w*/, "")
      index = index = this.codes.indexOf(code)

      if (index < 0) {
        code = this.codes[0]
      }
    }

    return code
  }


  selectLanguage(event) {
    if (event && event.type === "keydown" && event.key !== "Enter") {
      return
    }

    const code = this.codes[this.state.selected]
    Session.set("native", code)

    this.props.setView("Name")
  }


  selectFlag(event) {
    const selected = this.getItemIndex(event.target)
    if (selected === this.state.selected) {
      return this.selectLanguage()
    }
    this.setState({ selected })

    this.scrollFlag = true // move onscreen if necessary
  }


  mouseEnter(event) {
    const hover = this.getItemIndex(event.target)
    this.setState({ hover })
  }


  mouseLeave() {
    this.setState({ hover: -1 })
  }


  scrollFlagIntoView() {
    const element = this.scrollTo.current
    element.scrollIntoView({behavior: 'smooth'})
  }


  getItemIndex(element) {
    let index = -1

    while (element && element.tagName !== "LI") {
      element = element.parentNode
    }

    if (element) {
      const siblings = [].slice.call(element.parentNode.children)
      index = siblings.indexOf(element)
    }

    return index
  }


  getHover() {
    return (this.state.hover < 0)
           ? this.state.selected
           : this.state.hover
  }


  getSelected() {
    const flags = this.props.flags
    if (flags.length) {
      // return (flags[this.state.selected]).cue
      return this.state.selected

    } else {
      // The L10n collection has been reset while a visitor is at
      // this view. Return to the Splash screen until the collection
      // is repopulated
      setTimeout(this.props.setView, 0)
      return -1
    }
  }


  getPrompt(selected) {
    const cue  = "native_language"
    const code = this.codes[selected]
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  getFlags(selected) {
    const folder = this.props.folder
    const flags = this.props.flags.map((flag, index) => {
      // { "cue ": "ru"
        // , "ru": "Русский"
        // , "en": "Russian"
        // , "fr": "Russe"
        // , "file": "ru.png"
        // }
      const name = flag.cue
      const selected = this.state.selected === index
      const ref = selected ? this.scrollTo : null
      return <StyledLI
        key={name}
        selected={this.state.selected === index}
        onMouseEnter={this.mouseEnter}
        onMouseLeave={this.mouseLeave}
        onMouseUp={this.selectFlag}
        ref={ref}
      >
        <img
          src={folder + flag.file}
          alt={name}
        />
       </StyledLI>
    }) //.reverse()

    return <StyledFlags>{flags}</StyledFlags>
  }


  getButtonBar(selected) {
    const cue = "choose_language"
    const code = this.codes[selected]
    const prompt = localize(cue, code, this.props.phrases)
    const disabled = !Session.get("username")

    console.log("Native > Name disabled", disabled, "name:", Session.get("username"))

    return <StyledButtonBar>
      <StyledNavArrow
        invisible={true}
      />
      <StyledButton
        onMouseUp={this.selectLanguage}
        onKeyUp={this.selectLanguage}
      >
        {prompt}
      </StyledButton>
      <StyledNavArrow
        way="forward"
        disabled={disabled}
        onMouseUp={() => this.props.setView("Name")}
      />
    </StyledButtonBar>
  }


  render() {
    const selected = this.getSelected()
    if (selected < 0) {
      // No language data is available. We'll jump back to Splash
      return ""
    }

    const hover  = this.getHover()
    const prompt = this.getPrompt(hover)
    const flags  = this.getFlags(hover)
    const buttonBar = this.getButtonBar(selected)

    return <StyledProfile
      id="native-language"
    >
      <button
        style={{
          position:"fixed"
        , top: 0
        , left: 0
        }}
        onMouseUp={() => this.props.setView("Game")}
      >
        Start Game
      </button>
      {prompt}
      {flags}
      {buttonBar}
    </StyledProfile>
  }


  componentDidMount(delay) {
    // HACK: Not all images may have been loaded from MongoDB, so
    // let's wait a little before we scrollIntoView
    setTimeout(this.scrollFlagIntoView, 200)
  }


  componentDidUpdate() {
    if (this.scrollFlag) {
      this.scrollFlagIntoView()
      this.scrollFlag = false
    }
  }


  componentWillUnmount() {
    window.removeEventListener("resize", this.scrollFlagIntoView, false)
    document.removeEventListener("keydown", this.selectLanguage, false)
  }
}



export default withTracker(() => {
  const collection  = collections["L10n"]
  Meteor.subscribe(collection._name)

  const key         = "phrase"
  const flagsQuery  = { $and: [
                          { file: { $exists: true } }
                        , { file: { $ne: "xxxx"} }
                        ]
                      }
  const flags       = collection.find(flagsQuery).fetch()

  const phraseQuery = {
    $and: [
      { type: { $eq: key }}
    , { file: { $exists: false }}
    ]
  }
  const phrases     = collection.find(phraseQuery).fetch()

  const folderQuery = { folder:  { $exists: true }}
  const folder = collection.findOne(folderQuery).folder

  // ... and add the extracted data to the Game instance's this.props
  return {
    flags
  , phrases
  , folder
  }
})(Native)