import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { L10n } from '../../api/collections'
import { localize
       , getElementIndex
       } from '../../tools/utilities'

import { StyledProfile
       , StyledPrompt
       , StyledUL
       , StyledLI
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './styles'


class Native extends Component {
  constructor(props) {
    super(props)

    // console.log("Native", props)

    const codes = this.codes = this.props.flags.map(flag => flag.cue)
    const code  = Session.get("native") || this._getDefaultCode()
    const selected = codes.indexOf(code)

    this.scrollTo = React.createRef()
    this.state = { selected, hover: -1 }

    this.selectLanguage = this.selectLanguage.bind(this)
    this.selectFlag     = this.selectFlag.bind(this)
    this.mouseEnter     = this.mouseEnter.bind(this)
    this.mouseLeave     = this.mouseLeave.bind(this)
    this.scrollIntoView = this.scrollIntoView.bind(this)

    // Allow Enter to accept the default/current language
    document.addEventListener("keydown", this.selectLanguage, false)
    window.addEventListener("resize", this.scrollIntoView, false)
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
    const selected = getElementIndex(event.target, "UL")
    if (selected === this.state.selected) {
      // A second click = selection
      return this.selectLanguage()
    }

    this.setState({ selected })
    this.scrollFlag = true // move fully onscreen if necessary
  }


  mouseEnter(event) {
    const hover = getElementIndex(event.target, "UL")
    this.setState({ hover })
  }


  mouseLeave() {
    this.setState({ hover: -1 })
  }


  scrollIntoView() {
    const element = this.scrollTo.current
    if (element) {
      element.scrollIntoView({behavior: 'smooth'})
    }
  }


  getHover() {
    return (this.state.hover < 0)
           ? this.state.selected
           : this.state.hover
  }


  getPhrase(cue, index) {
    const code = this.codes[index]
    return localize(cue, code, this.props.phrases)
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
    const prompt = this.getPhrase("native_language", selected)

    return <StyledPrompt
      aspectRatio={this.props.aspectRatio}
    >
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
        aspectRatio={this.props.aspectRatio}
      >
        <img
          src={folder + flag.file}
          alt={name}
        />
       </StyledLI>
    }) //.reverse()

    return <StyledUL
      aspectRatio={this.props.aspectRatio}
    >
      {flags}
    </StyledUL>
  }


  getButtonBar(selected) {
    const prompt = this.getPhrase("choose_language", selected)
    const disabled = !Session.get("username")

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
    // console.log("Native props", this.props.aspectRatio)

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
      onMouseUp={this.props.points}
      onMouseDown={this.props.points}
      onTouchStart={this.props.points}
      onTouchEnd={this.props.points}
    >
      {prompt}
      {flags}
      {buttonBar}
    </StyledProfile>
  }


  componentDidMount(delay) {
    // HACK: Not all images may have been loaded from the server, so
    // let's wait a little before we scrollIntoView
    setTimeout(this.scrollIntoView, 200)
  }


  componentDidUpdate() {
    if (this.scrollFlag) {
      setTimeout(this.scrollIntoView, 1000) // <<< HARD-CODED
      this.scrollFlag = false
    }
  }


  componentWillUnmount() {
    window.removeEventListener("resize", this.scrollIntoView, false)
    document.removeEventListener("keydown", this.selectLanguage, false)
  }
}



export default withTracker(() => {
  const key         = "phrase"
  const flagsSelect = { $and: [
                          { file: { $exists: true } }
                        , { file: { $ne: "xxxx"} }
                        ]
                      }
  const flags       = L10n.find(flagsSelect).fetch()

  const phraseSelect = {
    $or: [
      { cue: "native_language" }
    , { cue: "choose_language" }
    ]
  }
  const phrases = L10n.find(phraseSelect).fetch()

  const folderSelect = { folder:  { $exists: true }}
  const folder = L10n.findOne(folderSelect).folder

  // ... and add the extracted data to the Game instance's this.props
  return {
    flags
  , phrases
  , folder
  }
})(Native)