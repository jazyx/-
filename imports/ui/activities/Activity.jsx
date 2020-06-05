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


// IMPORTANT NOTES
// ===============
// If the user has chosen not to restore_all on start up, we need to
// ignore the Groups .path value, but only the first time the Activity
// component is displayed. The withTracker wrapper will automatically
// trigger Activity.render() twice, even though there is no change to
// state or props. On my development machine, the time interval is
// around 40 ms.
//
// In order to ignore .path on the first significant display (rather
// than the first render), we need to:
//
// * Check if Session.get("restore_all") is falsy, and if so:
//   * Check that render is being called for the first or second time
//
// If all both of these circumstances occur, then:
//
// * The data in Groups .path will be ignored
// * The list of activities read in from the Activities collection
//   will be shown instead


var render = 0 // required as described above


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
    // console.log("goActivity:", choice)
    // { _id:         <unique string>
    // , version:     <integer>
    // , name:        { <code>: <string>
    //                , ...
    //                }
    // , icon:        "path/to/icon/^0.jpg"
    //
    //[, description: { <code>: <string>, ... }]
    //
    // , key:         <Activity level: collection name>
    // , parent:      <collection name/section name>
    // , tags:        [<string>, ...]
    // }

    // { description: {
    //     en: "Drag words onto pictures to learn vocabulary."
    //   , fr: "Glisser des mots ..."
    //   , ru: "Перетащите название ... чтобы выучить новые слова."
    //   }
    // , icon: "activities/drag/icon/^0.jpg"
    // , key: "Drag"
    //
    // , name: {
    //     en: "Drag"
    //   , fr: "Glisser"
    //   , ru: "Перетащить"
    //   }
    // , version: 1
    // , _id: "se9XX2t9fNK6pyjLP"
    // }

    if (choice) {
      if (choice.tag) {
        this.startActivity(choice)

      } else if (choice.key) {
        this.showOptions(choice)

      // } else {
      //   this.showActivities()
      }
    }
  }


  showOptions(choice) {
    const path = this.props.path
    path.push(choice.key)

    const options = {
      group_id: Session.get("group_id")
    , path
    }
    setPath.call(options)
  }


  startActivity(choice) {
    const group_id = Session.get("group_id")
    const path = this.props.path
    const view = path[0]
    path.push([choice.tag])

    setPath.call({
      path
    , group_id
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
    if (!map) {
      return ""
    }

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
      // const description = this.getPhrase("description", choice)
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

    } else {
      const choice = this.props.choices[this.state.selected]
      if (choice) {
        description = this.getPhrase("description", choice)
      }
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
    // console.log(JSON.stringify(this.props))
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


  componentDidUpdate(prevProps, prevState) {
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
  // console.log("withTracker render:", render)

  const ignorePath = (2 > render++) && !Session.get("restore_all")

  // Phrases
  const phraseSelect = {
    $or: [
      { cue: "activities" }
    , { cue: "start" }
    ]
  }
  const phrases = L10n.find(phraseSelect).fetch()

  // Path
  const pathSelect = {_id: Session.get("group_id") }
  const project    = { fields: { path: 1 }}
  let { path }     = Groups.findOne(pathSelect, project)

  let collection
    , choicesSelect
    , length
    , parent

  if (!ignorePath && Array.isArray(path) && (length = path.length)) {
    // Defensive coding: The Activity component should never be
    // rendered when  path ends with an array, but if it is rendered
    // in such a case, then we can minimize the damage by ignoring
    // the last item in path

    while ((parent = path[--length]) && Array.isArray(parent)) {}

    collection = collections[path[0]]
    choicesSelect = { parent }

  } else {
    collection = Activities
    choicesSelect = {}
    path = []
  }

  const choices = collection.find(choicesSelect).fetch()

  // console.log( "db." + collection._name + ".find("
  //            , JSON.stringify(choicesSelect)
  //            , ") >>> "
  //            , "choices:", choices
  //            )

  const props = {
    phrases
  , choices
  , path
  }

  return props
})(Activity)