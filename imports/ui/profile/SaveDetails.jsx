import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { L10n } from '../../api/collections'
import { localize } from '../../tools/utilities'

import { Checked, Unchecked } from '../img/svg'
import { Checkbox } from '../widgets/Checkbox'

import { StyledProfile
       , StyledPrompt
       , StyledCheckbox
       , StyledRadioButtonGroup
       , StyledRadioButton
       , StyledButton
       , StyledNavArrow
       , StyledButtonBar
       } from './styles'




class SaveDetails extends Component {
  constructor(props) {
    super(props)

    const autoChecked = Session.get("auto") || true
    const startFrom   = Session.get("startFrom") || "dashboard"
    const dashChecked = startFrom === "dashboard"
    this.state = { autoChecked, dashChecked }

    this.start = this.start.bind(this)

    this.handleCheckboxChange = this.handleCheckboxChange.bind(this)
    document.addEventListener("keydown", this.start, false)
  }


  start(event) {
    if (event && event.type === "keydown" && event.key !== "Enter") {
      return
    } else if (!this.state.selected) {
      return
    }

    this.props.setView("Activity")
  }


  handleCheckboxChange() {

  }


  getPrompt() {
    const cue = "preferences"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledPrompt>
      {prompt}
    </StyledPrompt>
  }


  getPreferencePane() {
    const code      = Session.get("native")
    const auto      = localize("auto_login", code, this.props.phrases)
    const resume    = localize("resume", code, this.props.phrases)
    const dashboard = localize("dashboard", code, this.props.phrases)

    return <Checkbox
      className="checker"
      checked={this.state.checked}
      handleCheckboxChange={this.handleCheckboxChange}
    />
    // return <div>
    //   <Checked
    //     style={{
    //       width: "10vmin"
    //     , height: "10vmin"
    //     , fill: "#fff"
    //     , stroke: "#090"
    //     }}
    //   />
    //   <Unchecked />
    //   <StyledCheckbox
    //     checked={this.state.autoChecked}
    //   >
    //    {auto}
    //   </StyledCheckbox>
    //   <StyledRadioButtonGroup>
    //     <StyledRadioButton
    //       name="start"
    //       disabled={this.state.autoChecked}
    //       checked={this.state.dashChecked}
    //     >
    //      {resume}
    //     </StyledRadioButton>
    //     <StyledRadioButton
    //       name="start"
    //       disabled={this.state.autoChecked}
    //       checked={!this.state.dashChecked}
    //     >
    //      {dashboard}
    //     </StyledRadioButton>
    //   </StyledRadioButtonGroup>
    </div>
  }


  getButtonBar() {
    const cue = "start"
    const code = Session.get("native")
    const prompt = localize(cue, code, this.props.phrases)

    return <StyledButtonBar>
      <StyledNavArrow
        way="back"
        invisible={true}
      />
      <StyledButton
        disabled={false}
        onMouseUp={this.start}
      >
        {prompt}
      </StyledButton>
      <StyledNavArrow
        way="forward"
        invisible={true}
      />
    </StyledButtonBar>
  }


  render() {
    const prompt = this.getPrompt()
    const preferencePane = this.getPreferencePane()
    const buttonBar = this.getButtonBar()

    return <StyledProfile
      id="check-pin"
    >
      {prompt}
      {preferencePane}
      {buttonBar}
    </StyledProfile>
  }
}



export default withTracker(() => {
  const select = {
   $or: [
      { cue: "preferences" }
    , { cue: "auto_login" }
    , { cue: "resume" }
    , { cue: "dashboard" }
    , { cue: "start" }
    ]
  }
  const phrases = L10n.find(select).fetch()

  return {
    phrases
  }
})(SaveDetails)
