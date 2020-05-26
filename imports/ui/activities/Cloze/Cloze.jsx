/**
 * Cloze.jsx
 *
 * The Clozer class uses componentDidUpdate() to synchronous new
 * phrases. This seems to run in to a React bug that is described
 * here:
 *
 *   https://github.com/facebook/react/issues/13424
 *
 * To work around it, we temporarily show the answer in the Input
 * field, and then immediately remove it. Search for "hack" below
 * for details.
 */


import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { Drag
       , L10n
       } from '../../../api/collections'
import { Cloze
       , Add
       , Cut
       , Fix
       , Flip
       } from './inputs'
import LSS from './lss'
import { localize } from '../../../tools/utilities'
import Sampler from '../../../tools/sampler'
import { setViewData
       , updateInput
       } from './methods'



class Clozer extends Component {
  constructor(props) {
    super(props)

    /// <<< HARD-CODED
    this.maxExtraChars = 2
    /// HARD-CODED >>>

    this.sampler = new Sampler({
      array: props.tasks
    , sampleSize: 1
    })

    this.newPhrase    = this.newPhrase.bind(this)
    this.checkSize    = this.checkSize.bind(this)
    this.updateInput  = this.updateInput.bind(this)
    this.refreshInput = this.refreshInput.bind(this)
    this.setMode      = this.setMode.bind(this)
    this.submit       = this.submit.bind(this)

    this.inputRef = React.createRef()

    // regex will match the first group of words that are linked
    // together_with_underscores or which form a sequence of words _all
    // _with _a _leading _underscore. Trailing _underscores_ will be
    // included in the match. Subsequent underscores will be silently
    // ignored and removed or replaced by spaces. If no underscores
    // are present, the final .* will ensure there is a match.
    this.regex  = /(.*?)((?:\w+(?=_))?(?:_(?:[^\s,;:.?!]*))+)(.*)|.*/

    this.zeroWidthSpace = "​" // "&#x200b;"
    this.timeout        = 0
    this.lastIndexDelay = 1000

    this.input          = ""
    this.state          = {
      start:    ""
    , expected: ""
    , cloze:    ""
    , end:      ""
    , maxLength: 0
    , minWidth:  0
    , width:     0
    , error:     false
    , correct:   false
    , reveal:    false
    , fix:       false
    }

    this.newPhrase()
  }


  newPhrase() {
    if (!this.props.isMaster) {
      return
    }

    const group_id = Session.get("group_id")

    let [ src, phrase ] = this.sampler.getSample()[0]
    src = this.props.folder + src

    const view_data = {
      phrase
    , src
      // React Hack: we must momentarily show (any) text, to make the
      // input respond to onChange. We will remove the text in the
      // setSize ref callback.
    , input: phrase
    , requireSubmit: false /// TODO
    }

    setViewData.call({ group_id, view_data })
  }


  treatPhrase(phrase) {
    const match  = this.regex.exec(phrase)

    let start = match[1]
    if (start) {
      start = start.trim() + " "
    } else {
      start = ""
    }

    let cloze = match[2]
    if (cloze) {
      cloze = cloze.replace(/[_\s]+/g, " ") // << nbsp
                   .trim() || " "
    } else { // There are no underscores. Use the entire string.
      cloze = match[0].trim()
    }

    const end = (match[3] || "").replace(/[_\s]+/g, " ").trimRight()
    const data = {
      phrase
    , expected: cloze
    , start
    , cloze
    , end
    , fromNewPhrase: true
    , width: 0
    , requireSubmit: false
    }

    this.setState(data)

    // Don't call treatPhrase again until the phrase changes
    this.phrase = phrase
  }


  updateInput(event) {
    const input = event.target.value.replace(this.zeroWidthSpace, "")

    const group_id = Session.get("group_id")
    const update = { group_id, input }
    updateInput.call(update)

    // this.setState({ input })
    // console.log("t่his.state:", this.state)

    // if (this.state.requireSubmit) {
    //   this.prepareToSubmit(input)

    // } else {
    //   clearTimeout(this.timeout)
    //   this.timeout = setTimeout(this.refreshInput, this.lastIndexDelay)

    //   this.treatInput(input, true)
    // }
  }


  refreshInput() {
    this.treatInput(this.state.input, false)
  }


  treatInput(input, ignoreLastIndex) {
    // console.log("treat input:", input)
    // console.log("t่his.state:", this.state)
    // this.setState({ input })

    let error = false
    let correct = false
    let onlyLastCharIsMissing = false
    let expectedOutput = [this.state.expected.toLowerCase()
                                             .replace(/ /g, " ")
                         ]
    let receivedOutput = [input.toLowerCase()]

    const toTreat = {
      expected: [expectedOutput]
    , received: [receivedOutput]
    }


    const lookForSwaps = (expectedArray, receivedArray, lss, error) => {
      const expectedString = expectedArray[0]
      const receivedString = receivedArray[0]
      const eLength = expectedString.length - 1 // -1 so we don't

      const rLength = receivedString.length - 1 // overrun with ii + 1
      let dontSplit = false

      if (eLength && rLength) {
        for ( let ii = 0; ii < eLength; ii += 1 ) {
          const ch1 = expectedString[ii]
          const offset1 = receivedString.indexOf(ch1)
          if (offset1 < 0) {
            // No match, so no flipped pair, so move on
          } else {
            const ch2 = expectedString[ii + 1]
            const offset2 = receivedString.indexOf(ch2)
            if (offset2 < 0) {
              // The second element of the pair is missing. No match.
            } else if (Math.abs(offset1 - offset2) === 1) {
              // We've found a swap. Split the strings into three
              splitStringAt(ch1+ch2, expectedArray, toTreat.expected)
              splitStringAt(ch2+ch1, receivedArray, toTreat.received)

              // There may be more swaps further along, but they will
              // be treated in a subsequent iteration of the while
              // loop below
              dontSplit = true
              error = true
              break
            }
          }
        }
      }

      if (!dontSplit) {
        splitStrings(expectedArray, receivedArray, lss)
      }

      return error
    }


    const splitStringAt = (chunk, array, toTreat) => {
      const string = array.pop()
      const offset = string.indexOf(chunk)
      const offend = offset + chunk.length

      const before = [string.substring(0, offset)]
      array.push(before)
      toTreat.push(before)

      array.push(chunk)

      const after  = [string.substring(offend)]
      array.push(after)
      toTreat.push(after)
    }


    const splitStrings = (expectedArray, receivedArray, lss) => {
      splitStringAt(lss, expectedArray, toTreat.expected)
      splitStringAt(lss, receivedArray, toTreat.received)
    }


    const flatten = (array, flattened=[]) => {
      let item
      // "" is falsy, but we need to treat empty string items, so we
      // need a tricky `while` expression which will return true for
      // any array or string, even it's empty, while at the same time
      // setting `item` to the value shifted from the array. When the
      // array is empty, item will take the value `undefined` and the
      // while expression will return false.


      while ((item = array.shift(), !!item || item === "")) {

        if (Array.isArray(item)) {
          const flip = item.flip || false
          item = flatten(item)
          item.forEach(entry => {
            if (flip) {
              entry.flip = true
            }

            flattened.push(entry)
          })

        } else {
          flattened.push(item)
        }
      }

      return flattened
    }


    const restoreCase = (array, original) => {
      let start = 0
      let end = 0
      array.forEach((chunk, index) => {
        end += chunk.length
        array[index] = original.substring(start, end)
        start = end
      })
    }


    const treatFix = (display, compare, key, cloze, hasSpace) => {
      if ( compare[0] === display[1]
        && compare[1] === display[0]
         ) {
        cloze.push(<Flip
          key={key}
          has_space={hasSpace}
        >{display}</Flip>)

        return
      }

      cloze.push(<Fix
        key={key}
        has_space={hasSpace}
      >{display}</Fix>)
    }


    const getClozeFromReceivedOutput = () => {
      const cloze = []

      receivedOutput.forEach((received, index) => {
        const key = index + received
        const expected = expectedOutput[index]
        const hasSpace = (received !== received.replace(/ /g, "")) + 0

        if (received.toLowerCase() === expected) {
          if (received) { // ignore empty items
            cloze.push(<span
              key={key}
            >{received}</span>)
          }

        // } else if (received.flip) {
        //   cloze.push(<Flip
        //     key={key}
        //     has_space={hasSpace}
        //   >{received}</Flip>)

        } else if (!received) {
          if (expected && index !== lastIndex) {
            if (cloze.length === 1 && index === typeIndex) {
              onlyLastCharIsMissing = true
            }
            cloze.push(<Add
              key={key}
              has_space={hasSpace}
            />)
          } // else both input and expected are "", for the last item
          // TODO: Set a timeout so that index !== lastIndex is ignored
          // if you stop typing before you reach the end.

        } else if (!expected) {
          cloze.push(<Cut
            key={key}
            has_space={hasSpace}
          >{received}</Cut>)

        } else {
          treatFix(received, expected, key, cloze, hasSpace)
        }
      })

      return cloze
    }


    const getClozeFromExpectedOutput = () => {
      const cloze = []

      expectedOutput.forEach((expected, index) => {
        const key = index + expected
        const received = receivedOutput[index]
        const hasSpace = (expected !== expected.replace(/ /g, "")) + 0

        if (expected.toLowerCase() === received) {
          if (expected) { // ignore empty items
            cloze.push(<span
              key={key}
            >{expected}</span>)
          }

        } else if (expected) {
          if (!received) {
            cloze.push(<Cut
              key={key}
              has_space={hasSpace}
            >{expected}</Cut>)

          } else {
            treatFix(expected, received, key, cloze, hasSpace)
          }
        }
      })

      return cloze
    }


    while (toTreat.expected.length) {
      const expectedArray = toTreat.expected.pop()
      const receivedArray = toTreat.received.pop()
      const expected = expectedArray[0]
      const received = receivedArray[0]

      if (!expected || !received) {
        // Add or cut, or both may be empty

      } else {
        const lss = LSS(expected, received)

        // console.log(expectedArray, receivedArray, lss)

        switch (lss.length) {
          case 0:
            // There is nothing in common in these strings.
            error = true
          break

          case 1:
            // There may be more matching letters, but flipped
            error=lookForSwaps(expectedArray,receivedArray,lss,error)
          break

          default:
            splitStrings(expectedArray, receivedArray, lss)
        }
      }
    }

    expectedOutput = flatten(expectedOutput)
    receivedOutput = flatten(receivedOutput)

    // console.log("ex",expectedOutput)
    // console.log("in",receivedOutput)

    // restoreCase(expectedOutput, this.state.expected)
    restoreCase(receivedOutput, input)

    // console.log("expected flattened:", expectedOutput)
    // console.log("received flattened:", receivedOutput)

    const lastIndex = receivedOutput.length - ignoreLastIndex
    const typeIndex = receivedOutput.length - 1

    let cloze
    if (this.state.requireSubmit) {
      cloze = getClozeFromExpectedOutput()
    } else {
      cloze = getClozeFromReceivedOutput()
    }

    if (cloze.length === 1) {
      if (input.length === this.state.expected.length) {
        correct = true
      }
    } else if (cloze.length && !onlyLastCharIsMissing) {
      error = true
    }

    if (!cloze.length) {
      cloze = [this.zeroWidthSpace]
    }

    // console.log(cloze.map(item => JSON.stringify(item.props)))


    const maxLength = this.state.expected.length + this.maxExtraChars
    const reveal = this.state.requireSubmit && !input
    const fix = (this.state.requireSubmit && error) || reveal

    this.setState({ cloze, error, correct, maxLength, reveal, fix })

    this.input = input
  }


  prepareToSubmit(input) {
    this.setState({
      cloze: input || this.zeroWidthSpace
    , error: false
    , correct: false
    })
  }


  /**
   * checkSize is called a first time as the `ref` of the
   * WidthHolder component. For this first call, the `span`
   * argument will contain the actual DOM element, so we capture that
   * and store it in `this.span`, because we won't get a second
   * chance.
   *
   * Subsequent calls are sent from WidthHolder's componentDidUpdate
   * method, which has no direct access to the DOM element itself, so
   * we need to use the stored `this.span`
   *
   * We need to check that either the width or the current value of
   * `this.input`, because if we reset this.state.width or
   * this.state.input to their current values, React will trigger a
   * new render, endlessly.
   */
  checkSize(span){
    if (span && !this.span) {
      this.span = span
      this.inputRef.current.focus()
    }
    this.setSize()
  }


  setSize() {
    const width = this.span.getBoundingClientRect().width + 1

    // console.log("setWidth:", width)

    if (this.state.width !== width){
      if (this.state.fromNewPhrase) {
        this.setState({
          width
        , minWidth: width
        , cloze: this.zeroWidthSpace
        , fromNewPhrase: false
        })
        // React Hack. In newPhrase, we had to add (some) text to the
        // input field, otherwise it would not show any user input and
        // would not therefore not trigger its onChange method.
        this.updateInput({
          target: {
            value: ""
          }
        })

      } else {
        this.setState({ width })
      }
    }
  }


  setMode() {
    const requireSubmit = !this.state.requireSubmit
    this.setState({ requireSubmit })

    if (requireSubmit) {
      this.setState({ cloze: this.state.input || this.zeroWidthSpace })
    } else {
      setTimeout(this.refreshInput, 0)
    }

    this.inputRef.current.focus()
  }


  submit() {
    this.refreshInput()
    this.setState({ input: "" })
  }


  render() {
    // console.log(this.props)
    const { src, input }= (this.props.view_data || {})
    if (!src) {
      return ""
    }

    return (
      <Cloze
        src={src}
        input={input}
        phrase={this.state}
        size={this.checkSize}
        change={this.updateInput}
        inputRef={this.inputRef}
      />
    )
  }


  componentDidUpdate() {
    const { src, phrase, input } = this.props.view_data

    if (!src) {
      // Wait until the src is defined
    } else if (this.phrase !== phrase) {
      this.treatPhrase(phrase)
    } else if (this.input !== input) {
      this.treatInput(input)
    }
  }
}



export default withTracker(() => {
  const key          = "furniture"
  const code         = Session.get("language").replace(/-\w*/, "")
  const taskSelect   = { type: { $eq: key }}
  const folderSelect = { key:  { $eq: key }}
  const items        = Drag.find(taskSelect).fetch()

  const tasks    = items.map(document => [ document.file
                                         , document.text[code]
                                         ]
                            )
  const folder   = Drag.findOne(folderSelect).folder

  // view_data
  const select   = { _id: Session.get("group_id") }
  const project  = { fields: { view_data: 1, logged_in: 1 } }
  const { view_data, logged_in } = Groups.findOne(select, project)

  const isMaster = logged_in
                 ? logged_in[0] === Session.get("d_code")
                 : false
  return {
    tasks
  , folder
  , view_data
  , isMaster
  }
})(Clozer)
