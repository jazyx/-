import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react'

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import collections,
       { L10n
       , Groups
       , Activities
       } from '../../api/collections'
import { localize
       , getElementIndex
       , substitute
       } from '../../tools/utilities'
import { setView
       , setPath
       } from '../../api/methods/methods'

import { StyledProfile
       , StyledPrompt
       , StyledChoice
       , StyledChoices
       , StyledDescription
       , StyledButton
       } from './Styles'


class Activity extends Component {
  constructor(props) {
    super(props)

    this.state = { selected: -1 }
    this.goActivity = this.goActivity.bind(this)
    this.selectActivity = this.selectActivity.bind(this)
    this.scrollIntoView = this.scrollIntoView.bind(this)

    this.scrollTo = React.createRef()

    // Allow Enter to accept the default/current language
    document.addEventListener("keydown", this.goActivity, false)
    window.addEventListener("resize", this.scrollIntoView, false)
  }


  selectActivity(event) {
    const element = event.target
    const selected = getElementIndex(element, "UL")
    if (selected === this.state.selected) {
      return this.goActivity()
    }

    this.setState({ selected })
    this.scrollFlag = true // move fully onscreen if necessary
  }


  goActivity(event) {
    if (event && event.type === "keydown" && event.key !== "Enter") {
      return
    }

    const choice = this.props.choices[this.state.selected]
    console.log("goActivity:", choice)
    // { _id:         <unique string>
    // , version:     <integer>
    // , name:        { <code>: <string>
    //                , ...
    //                }
    // , icon:        "path/to/icon/^0.jpg"
    // 
    //[, description: { <code>: <string>, ... }]
    //  
    // , key:         <Activity level: collection name
    // , parent:      <collection name/section name>
    // , tags:        [<string>, ...]
    // }

    if (choice) {
      if (choice.tags) {
        this.startActivity(choice)

      } else if (choice.parent) {
        this.showOptions(choice)

      // } else {
      //   this.showActivities()
      }
    }
  }


  showOptions(choice) {
    const path = Session.get("path")
    path.push(choice.parent)
  }


  startActivity(choice) {
    const path = Session.get("path")
    const view = path[0]
    path.push(choice.tags)
    setView.call({
      view
    , group_id: Session.get("group_id")
    })

    this.props.setView(view)
  }


  scrollIntoView() {
    const element = this.scrollTo.current
    if (element) {
      element.scrollIntoView({behavior: 'smooth'})
    }
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
    const prompt = localize("choices", code, this.props.phrases)

    return <StyledPrompt
      aspectRatio={this.props.aspectRatio}
    >
      {prompt}
    </StyledPrompt>
  }


  getChoices() {
    const choices = this.props.choices.map((choice, index) => {
      const lang        = Session.get("native").replace(/-.*/, "")
      const icon        = substitute(choice.icon, { "^0": lang })
      const src         = choice.folder
                        ? choice.folder + icon
                        : icon
      const name        = this.getPhrase("name", choice)
      const description = this.getPhrase("description", choice)
      const disabled    = !!choice.disabled
      const selected    = this.state.selected === index
      const ref         = selected
                        ? this.scrollTo
                        : ""
      return <StyledChoice
        key={name}
        src={src}
        ref={ref}
        disabled={disabled}
        selected={selected}
        onMouseUp={this.selectActivity}
        aspectRatio={this.props.aspectRatio}
      >
        <p>{name}</p>
      </StyledChoice>
    })
    return <StyledChoices
      id="choice-list"
      aspectRatio={this.props.aspectRatio}
    >
      {choices}
    </StyledChoices>
  }


  getDescription() {
    let description = ""
    if (this.state.selected < 0) {
      // Nothing is selected
    } else {
      const choice = this.props.choices[this.state.selected]
      description = this.getPhrase("description", choice)
    }

    return <StyledDescription
      aspectRatio={this.props.aspectRatio}
    >
      {description}
    </StyledDescription>
  }


  getButton() {
    const disabled = this.state.selected < 0
    const code = Session.get("native")
    const prompt = localize("start", code, this.props.phrases)

   return <StyledButton
      disabled={disabled}
      onMouseUp={this.goActivity}
      aspectRatio={this.props.aspectRatio}
    >
      {prompt}
    </StyledButton>
  }


  render() {
    const prompt = this.getPrompt()
    const choices = this.getChoices()
    const description = this.getDescription()
    const button = this.getButton()

    return <StyledProfile
      id="choices"
      aspectRatio={this.props.aspectRatio}
    >
      {prompt}
      {choices}
      {description}
      {button}
    </StyledProfile>
  }


  componentDidUpdate() {
    if (this.scrollFlag) {
      setTimeout(this.scrollIntoView, 1000) // <<< HARD-CODED
      this.scrollFlag = false
    }
  }


  componentWillUnmount() {
    window.removeEventListener("resize", this.scrollIntoView, false)
    document.removeEventListener("keydown", this.goActivity, false)
  }
}


export default withTracker(() => {
  // Phrases
  const phraseSelect = {
    $and: [
      { type: { $eq: "phrase" }}
    , { file: { $exists: false }}
    ]
  }
  const phrases = L10n.find(phraseSelect).fetch()


  // Path
  const pathSelect = {_id: Session.get("group_id") }
  const project = { fields: { path: 1 }}
  const { path } = (Groups.findOne(pathSelect, project) || {})
  let collection
    , choicesSelect


  // Choices
  if (Array.isArray(path) && path.length) {
    collection = collections[path[0]]
    const parent = path[path.length - 1]
    choicesSelect = { parent }

  } else {
    collection = Activities
    choicesSelect = {}
  }

  const choices = collection.find(choicesSelect).fetch()

  console.log( "db." + collection._name + ".find("
             , JSON.stringify(choicesSelect)
             , ") >>> "
             , "choices:", choices
             )

  const props = {
    phrases
  , choices
  }

  return props
})(Activity)