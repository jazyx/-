/**
 * Drag.jsx
 *
 * Creates a layout with up to 6 images, each with a space below for
 * the name of the image, and up to six <p> elements, containing the
 * names.
 *
 * When no-one else is interacting with the shared screen, a user may
 * start to drag a name, by this action become the temporary pilot for
 * the activity. The pilot's mouse|touch (pointer) does not actually
 * move the name. The pointer moves and so defines the values this.x
 * and this.y, which represent the top-left corner of the dragged p
 * element relative to the gameFrame. These values are converted to
 * numbers between 0.0 and 1.0 and saved in the MongoDB database as
 *   { _id: <group_id>
 *   , view_data: {
 *       x:       <0.0 - 1.0>
 *     , y:       <0.0 - 1.0>
 *     , drag_id: <id of dragged p element>
 *     , pilot;   <d_code> of this user's device>
 *     }
 *   }
 * The position of this user's pointer is transferred independently by
 * the Pointers component. The pointer position does not pass through
 * the MongoDB database, so it is not delayed. The Pointers component
 * may update the pointer more often than this Drag component updates
 * the position of the p element that it is dragging, so the p element
 * may appear to move jerkily while the pointer moves smoothly.
 *
 * On the pilot's screen, the dragName() method calculates the new
 * position of the dragged element, and sends this data to the
 * database. The actual position is set in the render() method.
 */


import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';
import styled, { css } from 'styled-components'
import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { Drag
       , L10n
       } from '../../../api/collections'
import { shuffle
       , getXY
       , setTrackedEvents
       } from '../../../tools/utilities'
import Sampler from '../../../tools/sampler'

import { setViewData
       , setDragTarget
       , updateDragTarget
       , dropDragTarget
       , toggleShow
       } from './methods'
import { localize } from '../../../tools/utilities'

 // ui/activities/Drag/Drag.jsx
 // tools/utilities.js


const StyledGame = styled.div`
  width: calc(100 * var(--w));
  height: calc(100 * var(--h));
  display: flex;
  flex-direction: column;
  justify-contents: space-between;
`

const StyledFrameSet = styled.div`
`

const StyledFrame = styled.div`
  width: calc(50 * var(--w));
  height: calc(29 * var(--h));
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  float: left;
  background: #fff;

  ${props => (props.aspectRatio > 3/5)
   ? `height: calc(42 * var(--h));

      &:nth-child(5), &:nth-child(6) {
        display: none;
      }
     `
   : ""
   }

  ${props => (props.aspectRatio > 5/4)
   ? `width: calc(33.3333 * var(--w));

      &:nth-child(5), &:nth-child(6) {
        display: flex;
      }
     `
   : ""
   }

  ${props => (props.aspectRatio > 3/2)
   ? `width: calc(33.3333 * var(--w));
      height: calc(88 * var(--h));

      &:nth-child(4), &:nth-child(5), &:nth-child(6) {
        display: none;
      }
     `
   : ""
  }
`

const StyledSquare = styled.div`
  width: calc(48 * var(--w));
  height: calc(48 * var(--w));
  margin: calc(1 * var(--w)) 0 0;
  background: url(${props => props.src});
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;

  ${props => (props.aspectRatio > 3/5)
   ? `height: calc(36 * var(--h));
     `
   : ""
  }

  ${props => (props.aspectRatio > 3/2)
   ? `width: calc(32 * var(--w));
      height: calc(66.66667 * var(--h));

     `
   : ""
  }
`

const StyledName = styled.p`
  width: 96%;
  height: 1.4em;
  text-align: center;
  box-sizing: border-box;

  font-size: calc(2 * var(--h));
  margin: 0.15em 0 0;
  ${props => props.show
           ? `border: none;
              opacity: 1;
              color: #000;
             `
           : `border: 0.05em dashed #999;
              color: #fff;
             `
  }

  /// 2 x 2 LAYOUT ///
  ${props => (props.aspectRatio > 3/5)
   ? `font-size: calc(2.5 * var(--h));
     `
   : ""
  }

  /// 3 x 1 LAYOUT ///
  ${props => (props.aspectRatio > 3/2)
   ? `font-size: calc(4.2 * var(--h));
     `
   : ""
  }
`

const StyledNames = styled.div`
  position: absolute;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-column-gap: 0px;
  grid-row-gap: 0px;
  width: 100%;
  text-align: center;
  font-size: calc(2 * var(--h));

  /// 2 x 2 LAYOUT ///
  ${props => (props.aspectRatio > 3/5)
   ? `grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      font-size: calc(2.5 * var(--h));

      & p:nth-child(1), & p:nth-child(2) {
        grid-row-start: 1;
      }

      & p:nth-child(3), & p:nth-child(4) {
        grid-row-start: 2;
      }

      & p:nth-child(5), & p:nth-child(6) {
        display: none;
      }
     `
   : ""
  }

  /// 3 x 2 LAYOUT ///
  ${props => (props.aspectRatio > 5/4)
   ? `grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, 1fr);

      & p:nth-child(5), & p:nth-child(6) {
        display: block;
      }
     `
   : ""
  }


  /// 3 x 1 LAYOUT ///
  ${props => (props.aspectRatio > 3/2)
   ? `grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(1, 1fr);
      font-size: calc(4.2 * var(--h));

      & p:nth-child(4), & p:nth-child(5), & p:nth-child(6) {
        display: none;
      }

      & p:nth-child(1), & p:nth-child(2), & p:nth-child(3) {
        display: block;
        grid-row-start: 1;
      }
     `
   : ""
  }
`

const StyledDraggable = styled.p`
  position: relative;
  margin: 0.05em 0.3em;
  box-sizing: border-box;
  border: 0.05em dashed #888;
  cursor: pointer;

   &.drag {
     background: rgba(255, 0, 0, 0.5);
     color: #fff;
   }

   &.dropped {
     opacity: 0;
     cursor: default;
   }
`

const StyledDragged = styled.p`
  position: fixed;

  width: 48%;
  height: 1.4em;
  text-align: center;
  box-sizing: border-box;

  margin: 0.05em 0.3em;
  box-sizing: border-box;
  border: 0.05em dashed #888;
  cursor: grabbing;
  background: rgba(255, 0, 0, 0.5);
  color: #fff;

  left: ${props => props.x};
  top: ${props => props.y};

  ${props => (props.aspectRatio > 5/4)
   ? "width: 32%;"
   : ""
   }
`

const StyledMask = styled.div`
  position: fixed;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.9);
  opacity: ${props => props.opacity};
  transition: opacity 3s;

  & h1 {
    font-size: calc(12 * var(--w));
    text-align: center;
    color: #fff;
  }

  & button {
    cursor: pointer;
    font-size: calc(5 * var(--w));
    padding: 0.25em;
    border: 0.25em outset;
    border-radius: 0.25em;

    &:active {
      border-style: inset;
    }
  }
`


class Dragger extends Component {
  constructor(props) {
    super(props)

    // console.log(props)
    // { children: []
    // , setView:  <function>
    // , images:   <[[<image>, <name>], ...]>
    // , folder :  <string>
    // }

    this.sampler = new Sampler({
      array: props.images
    , sampleSize: 6
    })

    this._newDeal(true) // sets this.props.view_data

    this.dragged    = React.createRef()
    this.dropTarget = React.createRef()
    this.gameFrame  = React.createRef()
    this.frameRect  = undefined // => ClientBoundingRect of gameFrame

    this.state = {
      count: 0
    , turn: 0
    , mask: 0
    }

    this._newDeal    = this._newDeal.bind(this)
    this._startDrag  = this._startDrag.bind(this)
    this.dragStarted = this.dragStarted.bind(this)
    this.dragName    = this.dragName.bind(this)
    this.dropName    = this.dropName.bind(this)
    this._fadeMask   = this._fadeMask.bind(this)
    // this.resize = this.resize.bind(this)
    // window.addEventListener("resize", this.resize, false)
  }


  getPhrase(cue) {
    const code = Session.get("language")
    return localize(cue, code, this.props.phrases)
  }


  _newDeal(startUp) {
    if (!Session.get("isMaster")) {
      return
    }

    const items = this.sampler.getSample()
    const view_data = this._getLayouts(items)
    view_data.show  = view_data[6].hints.reduce((show, hint) => {
      hint = this._hyphenate(hint)
      show[hint] = false
      return show
    }, {})
    const group_id = Session.get("group_id")

    setViewData.call({ group_id, view_data })

    if (startUp === true) {
      return
    }

    const turn = this.state.turn + 1
    const complete = 0
    const mask = 0
    this.setState({ turn, complete, mask })
    this.timeOut = 0
  }


  _getLayouts(items) {
    const layouts = { 3: 0, 4: 0, 6: 0 }
    const counts = Object.keys(layouts)

    counts.forEach(count => {
      // The first 3 are always shown
      let names = items.slice(0, count) // [[image, name], ...]
      let images = shuffle(names.slice(0))

      const hints = images.map(item => item[1])
      images      = images.map(item => item[0])
      names       = names .map(item => item[1])

      layouts[count] = {
        images
      , hints
      , names
      }
    })

    return layouts
  }


  _aspectRatio() {
    const gameFrame = this.gameFrame.current

    if (!gameFrame) {
      return 0
    }

    const { width, height } = gameFrame.getBoundingClientRect()
    return width / height
  }


  _itemCount(aspectRatio) {
    let count = 3

    if (aspectRatio <= 3/5) {
      count = 6
    } else if (aspectRatio <= 5/4) {
      count = 4
    } else if (aspectRatio <= 3 / 2) {
      count = 6
    }

    return "" + count
  }


  _startDrag(event) {
    if (this.props.view_data.pilot) {
      return console.log("Can't start dragging")
    }

    const target = event.target
    if (target.tagName !== "P") {
      return
    } else if (this.state.complete) {
      return
    } else if (target.classList.contains("dropped")) {
      return
    }

    switch (event.type) {
      case "touchstart":
        this.touch = + new Date()
      break
      case "mousedown":
        if ((+ new Date() - this.touch) < 100) {
          return
        }
    }

    this.eventType = event.type
    this.drag_id   = target.id

    // Store the absolute mouse position at the start of the drag
    const { x: startX, y: startY } = getXY(event, "client")

    // Remember the rect of the gameFrame
    const gameFrame = this.gameFrame.current
    this.frameRect  = gameFrame.getBoundingClientRect()

    // Find the starting position of the dragged element, in the
    // client frame of reference
    let { x, y } = target.getBoundingClientRect()

    // Remember the offset of the top-left, relative to the pointer.
    // Just add the current pointer position to get the element
    // position
    this.offset = {
      x: x - startX
    , y: y - startY
    }

    // Share the top left corner of the dragged element relative to
    // the gameFrame, as a ratio of width and height

    const dragData = {
      drag_id:  target.id
    , group_id: Session.get("group_id")
    , pilot:    Session.get("d_code")
    , x
    , y
    }
    this._mapToGameFrame(dragData)

    setDragTarget.call(dragData, this.dragStarted)
  }


  _mapToGameFrame(dragData) {
    const { top, left, width, height } = this.frameRect
    dragData.x = (dragData.x - left) / width
    dragData.y = (dragData.y - top) / height
  }


  dragStarted(error, data) {
    if (error) {
      return console.log("dragStarted", error)
    } else if (!data) {
      return console.log("drag not started")
      // We could forget...
      // * this.eventType
      // * this.offset
      // * this.frameRect
      // ... but there's no pressing need
    } // else data should be 1

    this.cancel = setTrackedEvents({
      event: {
        type: this.eventType
      }
    , drag: this.dragName
    , drop: this.dropName
    })

    // console.log("Drag .cancel:", this.cancel)
    // { actions: {
    //     move: "mousemove"
    //   , end: "mouseup"
    //   }
    // , drag: this.dragName
    // , drop: this.dropName
    // }
  }


  dragName(event) {
    let { x, y } = getXY(event)
    x += this.offset.x
    y += this.offset.y

    this.lastPosition = { x, y } // use a different object
    const dragData    = {
      x
    , y
    , group_id:Session.get("group_id")
    , pilot:Session.get("d_code")
    }

    // // Place the element physically under the pilot's mouse...
    // target.style.left = x + "px"
    // target.style.top  = y + "px"

    // ... then tell everyone else about it
    this._mapToGameFrame(dragData)

    const result = updateDragTarget.call(dragData)

    console.log("dragName result:", result, x, y)
  }


  dropName(event) {
    const result = dropDragTarget.call({
      group_id: Session.get("group_id")
    })

    console.log("dropName result:", result)
    setTrackedEvents(this.cancel)

  //     target.classList.remove("drag")

  //     if (isNaN(this.lastPosition.x)) {
  //       // The user just clicked and released, with no drag
  //       return
  //     }

    const elements = document.elementsFromPoint(
      this.lastPosition.x
    , this.lastPosition.y
    )
    if (elements.length < 3) {
      return
    }

    const onTarget = !(elements.indexOf(this.dropTarget.current)<0)

    // target.style.removeProperty("left")
    // target.style.removeProperty("top")

    if (onTarget) {
      const target = this.dragged.current
      target.classList.add("dropped")

      const show = this.props.view_data.show
      const showData = {
        group_id: Session.get("group_id")
      , hint:     this.drag_id // this.state.dropClass
      }
      toggleShow.call(showData)
    }

    this.drag_id = undefined // this.setState({ dropClass: "" })
  }



  // xxx() {
  //   // Choose target
  //   const dropClass = this._hyphenate(target.innerText)
  //   this.setState({ dropClass })

  //   const { x: startX, y: startY } = getXY(event)

  //   const drag = (event) => {
  //     const { x, y } = getXY(event)
  //     target.style.left = (x - startX) + "px"
  //     target.style.top = (y - startY) + "px"

  //     this.lastX = x
  //     this.lastY = y
  //   }

  //   const drop = (event) => {
  //     setTrackedEvents(cancel)
  //     target.classList.remove("drag")

  //     if (isNaN(this.lastPosition.x)) {
  //       // The user just clicked and released, with no drag
  //       return
  //     }

  //     const elements = document.elementsFromPoint(
  //       this.lastPosition.x
  //     , this.lastPosition.y
  //     )
  //     if (elements.length < 3) {
  //       return
  //     }

  //     const onTarget = !(elements.indexOf(this.dropTarget.current)<0)

  //     target.style.removeProperty("left")
  //     target.style.removeProperty("top")

  //     if (onTarget) {
  //       target.classList.add("dropped")

  //       const show = this.props.view_data.show
  //       const showData = {
  //         group_id: Session.get("group_id")
  //       , hint: this.state.dropClass
  //       }
  //       toggleShow.call(showData)
  //     }

  //     this.setState({ dropClass: "" })
  //   }

  //   const cancel = setTrackedEvents({ event, drag, drop })
  // }


  _hyphenate(expression) {
    return expression.replace(/ /g, "-")
  }


  _getFrames(layout, aspectRatio) {
    const frames = layout.images.map((item, index) => {
      const src = this.props.folder + item
      const hint = layout.hints[index]
      const className = this._hyphenate(hint)
      const show = this.props.view_data.show[className]
      const ref = className === this.drag_id // this.state.dropClass
                ? this.dropTarget
                : null

      return <StyledFrame
        key={"frame"+index}
        ref={ref}
        className={className}
        aspectRatio={aspectRatio}
      >
        <StyledSquare
          key={item}
          src={src}
          aspectRatio={aspectRatio}
        />
        <StyledName
          className="can-select"
          show={show}
          key={hint}
          aspectRatio={aspectRatio}
        >
          {hint}
        </StyledName>
      </StyledFrame>
    })

    return <StyledFrameSet
      aspectRatio={aspectRatio}
    >
      {frames}
    </StyledFrameSet>
  }


  _getNames(layout, aspectRatio) {
    const view_data = this.props.view_data || {}
    const names = layout.names.map((name, index) => {
      const id = this._hyphenate(name)

      if (view_data.drag_id === id) {
        return this.draggedName(name, index, aspectRatio, view_data)
      }

      const className = this.props.view_data.show[id]
                      ? "dropped"
                      : ""

      return <StyledDraggable
        key={index+"-"+name}
        id={id}
        className={className}
        aspectRatio={aspectRatio}
      >
        {name}
      </StyledDraggable>
    })

    return names
  }


  draggedName(name, index, aspectRatio, view_data) {
    let { pilot, drag_id } = view_data
    const target = document.getElementById(drag_id)
    const { top, left, width, height } = this.frameRect

    // Use position created on the last mouse|touch move by the pilot
    let { x, y } = view_data
    x = x * width + left
    y = y * height + top

    return <StyledDragged
      key={index+"-"+name}
      id={drag_id}
      className="drag"
      show={false}
      aspectRatio={aspectRatio}
      x={x + "px"}
      y={y + "px"}
      ref={this.dragged}
    >
      {name}
    </StyledDragged>
  }


  _fadeMask() {
    this.setState({ mask: 1 })
  }


  _newGame(complete, aspectRatio) {
    if (complete) {
      const prompt = this.getPhrase("congratulations")
      const replay = this.getPhrase("play_again")

      if (!this.timeOut) {
        this.timeOut = setTimeout(this._fadeMask, 0)
      }

      return <StyledMask
        opacity={this.state.mask}
        aspectRatio={aspectRatio}
      >
        <h1>{prompt}!</h1>
        <button
          onMouseUp={this._newDeal}
        >
          {replay}
        </button>
      </StyledMask>

    } else {
      return ""
    }
  }


  render() {
    console.log("Drag render props", this.props)
    const aspectRatio = this.props.aspectRatio // _aspectRatio()
    if (!this.props.view_data || !aspectRatio) {
      // Force the gameFrame ref to become something
      return <StyledGame
        ref={this.gameFrame}
      />
    }

    const itemCount = this._itemCount(aspectRatio)
    const complete = this.props.completed === itemCount
                   ? + new Date()
                   : 0
    const layout = this.props.view_data[itemCount]
    const frames = this._getFrames(layout, aspectRatio)
    const names = this._getNames(layout, aspectRatio)
    const newGame = this._newGame(complete, aspectRatio)

    return (
      <StyledGame
        id="game-layout"
        aspectRatio={aspectRatio}
        ref={this.gameFrame}
      >
        {frames}
        <StyledNames
          onMouseDown={this._startDrag}
          onTouchStart={this._startDrag}
          aspectRatio={aspectRatio}
        >
          {names}
        </StyledNames>
        {newGame}
      </StyledGame>
    )
  }
}


export default withTracker(() => {
  function turnCompleted(show) {
    const keys = Object.keys(show)
    const completed = keys.reduce(
      (counter, key) => counter + show[key]
    , 0)

    return "" + completed
  }

  // Images
  const key          = "furniture"
  const code         = Session.get("language").replace(/-\w*/, "")
  let imageSelect  = { type: { $eq: key }}
  const folderSelect = { key:  { $eq: key }}
  const items = Drag.find(imageSelect).fetch()

  const images = items.map(document => [ document.file
                                       , document.text[code]
                                       ]
                          )
  const folder = Drag.findOne(folderSelect).folder

  // view_data
  const viewDataSelect  = { _id: Session.get("group_id") }
  const project = { fields: { view_data: 1 } }
  const { view_data } = Groups.findOne(viewDataSelect, project)
  const completed = view_data
                  ? turnCompleted(view_data.show)
                  : false
  // Localization
  const phraseSelect = {
    $or: [
      { cue: "congratulations" }
    , { cue: "play_again" }
    ]
  }
  const phrases = L10n.find(phraseSelect).fetch()


  // ... and add extracted data to the Game instance's this.props
  return {
    images
  , folder
  , view_data
  , completed
  , phrases
  }
})(Dragger)
