import React, { Component } from 'react';
import styled, { css } from 'styled-components'
import { withTracker } from 'meteor/react-meteor-data'

import collections from '../../api/collections'
import { tweenColor } from '../../core/utilities'


const colours = {
  background: "#003"
}
colours.active = tweenColor(colours.background, "#fff", 0.1)


// On Android, the page may be shown full screen but with the address
// bar covering the top part of the page. For this reason, the prompt
// header is given a top margin of 10vh, so that it is visible at all
// times.

const StyledNative = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  height: 100vh;
  background-color: ${colours.background};
`

const StyledPrompt = styled.h1`
  display: flex;
  align-items: center;
  height: 20vw;
  font-size: 8vw;
  text-align: center;
  margin: 10vh 0 2vh;
  color: #fff;

  @media (min-aspect-ratio: 1/1) {
    height: 20vh;
    font-size: 8vh;
  }
`

const StyledFlags = styled.ul`
  list-style-type: none;
  width: 100%;
  height: calc(88vh - 35vw);
  padding: 0;
  margin: 0;
  text-align: center;
  overflow-y: auto;

  @media (min-aspect-ratio: 1/1) {
    height: 53vh;
    white-space: nowrap;
  }
`

const StyledLI = styled.li`
  & img {
    width: 30vw;
    opacity: ${props => props.selected
                      ? 1
                      : 0.25
              };
  }

  &:hover img {
    opacity: ${props => props.selected
                      ? 1
                      : 0.5
              };
  }

  &:hover {
    background-color: ${colours.active};
  }

  @media (min-aspect-ratio: 1/1) {
    display: inline-block;
    clear: both;
    height: calc(53vh - 20px);

    & img {
      position: relative;
      top: 10vh;
      width: 33vh;
    }
  }
`

const StyledButton = styled.button`
  background: transparent;
  border-radius: 10vh;
  padding: 0.1em 1em;
  color: #fff;
  height: 15vw;
  width: 80vw;
  max-width: 80vh;
  font-size: 6vw;

  &:active {
    background: ${colours.active};
  }

  @media (min-aspect-ratio: 1/1) {
    height: 15vh;
    font-size: 6vh;
  }
`


class Native extends Component {
  constructor(props) {
    super(props)
    const codes = this.codes = this.props.flags.map(flag => flag.cue)
    const code  = this._getDefaultLanguageCode()
    const selected = codes.indexOf(code)

    this.scrollTo = React.createRef()
    this.state = { selected, hover: -1 }

    this.selectLanguage     = this.selectLanguage.bind(this)
    this.selectFlag         = this.selectFlag.bind(this)
    this.mouseEnter         = this.mouseEnter.bind(this)
    this.mouseLeave         = this.mouseLeave.bind(this)
    this.scrollFlagIntoView = this.scrollFlagIntoView.bind(this)

    window.addEventListener("resize", this.scrollFlagIntoView, false)
  }


  _getDefaultLanguageCode() {
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


  selectLanguage() {
    const code = this.codes[this.state.selected]
    console.log("Language selected:", code)
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
    const code = this.codes[selected]
    const prompt = (this.props.phrases.find(phrase => (
      phrase.cue === "native_language"
    )))[code]

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


  getButton(selected) {
    const code = this.codes[selected]
    const prompt = (this.props.phrases.find(phrase => (
      phrase.cue === "choose_language"
    )))[code]

    return <StyledButton
      onMouseUp={this.selectLanguage}
    >
      {prompt}
    </StyledButton>
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
    const button = this.getButton(selected)

    return <StyledNative
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
      {button}
    </StyledNative>
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