import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { teacher } from '../../api/teacher'
console.log(teacher)

import { L10n
       , Users
       , Groups
       } from '../../api/collections'

import { localize
       , getElementIndex
       , removeFrom
       , arrayOverlap
       } from '../../tools/utilities'

import { StyledProfile
       , StyledPrompt
       , StyledUL
       , StyledLearner
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './styles'




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

    teacher.restore()
  }


  share(event) {
    if (event && event.type === "keydown" && event.key !== "Enter") {
      return
    } else if (!this.state.selected < 0) {
      return
    }

    const group = this.props.groups[this.state.selected]

    teacher.join(group)
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
      const names = group.members.map(member => {
        // TODO: Show username greyed out if user is not loggedIn
        const username = member.username
        return <p
          key={username}
        >
          {username}
        </p>
      })
      const selected = this.state.selected === index
      const ref = selected ? this.scrollTo : ""
      const disabled = !group.loggedIn.length

      return <StyledLearner
        key={index}
        ref={ref}
        disabled={disabled}
        selected={selected}
        onMouseUp={this.toggleLearner}
      >
        {names}
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
      id="teach"
      onMouseUp={this.props.points}
      onMouseDown={this.props.points}
      onTouchStart={this.props.points}
      onTouchEnd={this.props.points}
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
  const phrases = getPhrases()
  const groups = getGroups()
  // console.log(groups)

  const props = {
    phrases
  , groups
  }

  return props
})(Teach)



function getPhrases() {
  const select = {
    $or: [
      { cue: "select_students" }
    , { cue: "share" }
    ]
  }
  const phrases = L10n.find(select).fetch()

  return phrases
}


function getGroups() {
  // Groups records have the format:
  // {
  //   "_id" :       "Q6Sb6WsfokFdf5Ccw",
  //
  //   "owner" :     "aa",
  //   "language" :  "ru",
  //   "active" :    false,
  //   "lobby" :     "",
  //   "chat_room" : "",
  //
  //   "members" :   [ <user_id>,     ...,    <teacher_id> ],
  //   "loggedIn" :  [ <user d_code>, ... <teacher d_code> ],
  //   "view" :      "Activity"
  // }

  // We will return a filtered list with the format
  // [ { _id: <>
  //   , view: <string>
  //   , members: [
  //       { _id: <user_id>
  //       , username: <string>
  //       , loggedIn: <boolean>
  //       }
  //     , ...
  //     ]
  //   }
  // , ...
  // ]

  // Get a list of Groups that the Teacher owns, with their members
  // (which will include the Teacher), loggedIn details and view.
  // Sort the groups so that groups with loggedIn users appear first

  const teacher_id = Session.get("teacher_id")
  const d_code = Session.get("d_code")
  const query = { owner: teacher_id }
  const project = {
    fields: {
      members: 1
    , loggedIn: 1
    , view: 1
    }
  }
  // console.log(
  //   "db.groups.find("
  // , JSON.stringify(query)
  // , ","
  // , JSON.stringify(project)
  // , ").pretty()"
  // )
  let groups = Groups.find(query, project)
                     .fetch()
                     .sort((a, b) => ( // non-zero lengths first
                         ( b.loggedIn.length > 1)
                       - ( a.loggedIn.length > 1)
                      ))
  const user_ids = getUniqueValues(groups, "members", teacher_id)
  const userMap  = getUserMap(user_ids)
  addUserNamesTo(groups, userMap, teacher_id)

  return groups
}


function getUniqueValues(groups, key, exclude) {
  const reducer = (reduced, group) => (
     [...reduced, ...group[key]]
  )

  const uniqueValues = (value, index, array) => (
    array.indexOf(value) === index
  )

  const output = groups.reduce(reducer, [])
                       .filter(uniqueValues)
  removeFrom(output, exclude)

  return output
}


function getUserMap(user_ids) {
  const map = {}
  const project = { fields: { username: 1, loggedIn: 1 }}

  user_ids.forEach(_id => {
    const user = Users.findOne({ _id }, project)
    map[_id] = user
  })

  return map
}


function addUserNamesTo(groups, userMap, exclude) {
  groups.forEach(group => {
    const loggedIn = group.loggedIn
    const members  = group.members.filter( _id => _id !== exclude )
                                  .map( _id => {
      const userData    = userMap[_id] // vvv array vvv
      const overlap     = arrayOverlap(userData.loggedIn, loggedIn)
      userData.loggedIn = overlap.length // <<< Boolean

      return userData
    })

    group.members = members
  })
}
