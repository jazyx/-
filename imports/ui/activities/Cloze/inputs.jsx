/**
 * /imports/ui/activities/Cloze/inputs.jsx
 */



import React, { Component } from 'react';
import { StyledDiv
       , StyledTextArea
       , StyledPhrase
       , StyledInputDiv
       , StyledInput
       , StyledFeedback
       , StyledAdd
       , StyledCut
       , StyledFix
       , StyledFlip
       , StyledToggle
       , StyledSubmit
       , StyledImage
       } from './styles'



// export const TargetPhrase = (props) => (
//   <StyledDiv>
//     <h2>Target Phrase:</h2>
//     <StyledTextArea
//       placeholder="Enter a target phrase to test"
//       onChange={props.newPhrase}
//       value={props.phrase}
//     />
//     <Toggle
//       setMode={props.setMode}
//       checked={props.checked}
//     />
//     <Submit
//       submit={props.submit}
//       checked={props.checked}
//     />
//   </StyledDiv>
// )



export class Cloze extends Component {
  render() {
   if (!this.props.phrase.cloze) {
      return ""
    }

    const { start
          , cloze
          , end
          , minWidth
          , width
          , error
          , correct
          , maxLength
          , requireSubmit
          , reveal
          , fix
          } = this.props.phrase
    const { src
          , input
          , size
          , change
          , inputRef
          } = this.props

     window.change = change

    // console.log(this.props)

    return (
      <StyledPhrase
        id="answer"
      >
        <StyledImage
          src={src}
        />
        <span>{start}</span>

        <StyledInputDiv
          id="input"
          minWidth={minWidth}
          width={width}
        >
          <StyledInput
            className="input can-select"
            error={error}
            correct={correct}
            requireSubmit={requireSubmit}
            maxLength={maxLength}
            value={input}
            onChange={change}
            spellCheck={false}
            ref={inputRef}
          />

          <Feedback
            size={size}
            cloze={cloze}
            fix={fix}
            reveal={reveal}
          />

        </StyledInputDiv>

        <span>{end}</span>
      </StyledPhrase>
    )
  }
}


class Feedback extends Component{
  render() {
    const { size, cloze, fix, reveal } = this.props

    return (
      <StyledFeedback
        className="cloze"
        ref={size}
        fix={fix}
        reveal={reveal}
      >
        {cloze}
      </StyledFeedback>
    )
  }


  componentDidUpdate() {
    this.props.size()
  }

}



export const Add = () => (
  <StyledAdd />
)



export const Cut = (props) => (
  <StyledCut
    has_space={props.has_space}
  >
    {props.children}
  </StyledCut>
)



export const Fix = (props) => (
  <StyledFix
    has_space={props.has_space}
  >
    {props.children}
  </StyledFix>
)



export const Flip = (props) =>  (
  <StyledFlip
    has_space={props.has_space}
  >
    {props.children}
  </StyledFlip>
)


export const Toggle = props => (
  <StyledToggle>
    Require Submit
    <input type="checkbox"
      onChange={props.setMode}
      checked={props.checked}
    />
  </StyledToggle>
)


export const Submit = props => (
  <StyledSubmit
    onMouseDown={props.submit}
    visible={props.checked}
  >
    Submit
  </StyledSubmit>
)