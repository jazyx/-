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

    this.sampler = new Sampler({
      array: props.images
    , sampleSize: 6
    })

    this.dragged    = React.createRef()
    this.dropTarget = React.createRef()
    this.gameFrame  = React.createRef()

    this.state = {
      count: 0
    , turn: 0
    , mask: 0
    }

    this.newDeal     = this.newDeal.bind(this)
    this.startDrag   = this.startDrag.bind(this)
    this.dragStarted = this.dragStarted.bind(this)
    this.dragName    = this.dragName.bind(this)
    this.dropName    = this.dropName.bind(this)
    this.fadeMask   = this.fadeMask.bind(this)

    // this.eventType   "mousedown" | "touchstart" for setTrackedEvent
    // this.touch       prevents mouse events if action is touch
    // this.dragId      id of dragged <p> element
    // this.offset      offset from pointer to topleft of dragged item  
    // this.cancel      data to end setTrackedEvent
    //                  { actions: {
    //                      move: "mousemove"
    //                    , end: "mouseup"
    //                    }
    //                  , drag: this.dragName
    //                  , drop: this.dropName
    //                  }
    // this.lastLocation { x: clientX, y: clientY }

    this.newDeal(true) // sets this.props.view_data
  }


  getPhrase(cue) {
    const code = Session.get("language")
    return localize(cue, code, this.props.phrases)
  }


  newDeal(startUp) {
    if (startUp === true && !this.props.isMaster) {
      return
    }

    const items = this.sampler.getSample()
    const view_data = this.getLayouts(items)
    view_data.show  = view_data[6].hints.reduce((show, hint) => {
      hint = this.hyphenate(hint)
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


  getLayouts(items) {
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


  itemCount(aspectRatio) {
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


  startDrag(event) {
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
    this.lastLocation = getXY(event, "client")

    // Find the starting position of the dragged element, in the
    // client frame of reference
    let { x, y } = target.getBoundingClientRect()

    // Remember the offset of the top-left, relative to the pointer.
    // Just add the current pointer position to get the element
    // position
    this.offset = {
      x: x - this.lastLocation.x
    , y: y - this.lastLocation.y
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
    this.mapToGameFrame(dragData)

    setDragTarget.call(dragData, this.dragStarted)
  }


  getFrameRect() {
    const gameFrame = this.gameFrame.current
    return gameFrame.getBoundingClientRect()
  }


  mapToGameFrame(dragData) {
    const frameRect = this.getFrameRect()
    const { top, left, width, height } = frameRect
    dragData.x = (dragData.x - left) / width
    dragData.y = (dragData.y - top) / height
  }


  dragStarted(error, data) {
    if (error) {
      return console.log("dragStarted", error)
    } else if (!data) {
      return console.log("drag not started")
    }

    this.cancel = setTrackedEvents({
      event: {
        type: this.eventType
      }
    , drag: this.dragName
    , drop: this.dropName
    })
  }


  dragName(event) {
    this.lastLocation = getXY(event)

    const dragData    = {
      x: this.lastLocation.x + this.offset.x
    , y: this.lastLocation.y + this.offset.y
    , group_id:Session.get("group_id")
    , pilot:Session.get("d_code")
    }
    this.mapToGameFrame(dragData)

    const result = updateDragTarget.call(dragData)
  }


  dropName(event) {
    // Tell all users that the dragged element was dropped, regardless
    // of where this happened
    const result = dropDragTarget.call({
      group_id: Session.get("group_id")
    })

    setTrackedEvents(this.cancel)

    const elements = document.elementsFromPoint(
      this.lastLocation.x
    , this.lastLocation.y
    )
    if (elements.length < 3) {
      return
    }

    const onTarget = !(elements.indexOf(this.dropTarget.current)<0)

    if (onTarget) {
      // Now we can tell all users that the text was well placed
      const showData = {
        group_id: Session.get("group_id")
      , hint:     this.drag_id
      }

      toggleShow.call(showData)
    }
  }


  hyphenate(expression) {
    return expression.replace(/ /g, "-")
  }


  getFrames(layout, aspectRatio) {
    const frames = layout.images.map((item, index) => {
      const src = this.props.folder + item
      const hint = layout.hints[index]
      const className = this.hyphenate(hint)
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


  getNames(layout, aspectRatio) {
    const view_data = this.props.view_data || {}
    const names = layout.names.map((name, index) => {
      const id = this.hyphenate(name)

      if (view_data.drag_id === id) {
        return this.draggedName(name, index, aspectRatio, view_data)
      }

      const className = this.props.view_data.show[id]
                      ? "dropped"
                      : ""

      return <div
        key={id}
      >
        <StyledDraggable
          id={id}
          className={className}
          aspectRatio={aspectRatio}
        >
          {name}
        </StyledDraggable>
      </div>
    })

    return names
  }


  draggedName(name, index, aspectRatio, view_data) {
    let { pilot, drag_id } = view_data
    const target = document.getElementById(drag_id)
    const frameRect = this.getFrameRect()
    const { top, left, width, height } = frameRect

    // Use position created on the last mouse|touch move by the pilot
    let { x, y } = view_data
    x = x * width + left
    y = y * height + top

    return <div>
      <StyledDragged
        id={drag_id}
        key={index+"-"+name}
        className="drag"
        aspectRatio={aspectRatio}
        x={x + "px"}
        y={y + "px"}
        ref={this.dragged}
      >
        {name}
      </StyledDragged>
    </div>
  }


  fadeMask() {
    this.setState({ mask: 1 })
  }


  newGame(complete, aspectRatio) {
    if (complete) {
      const prompt = this.getPhrase("congratulations")
      const replay = this.getPhrase("play_again")

      if (!this.timeOut) {
        this.timeOut = setTimeout(this.fadeMask, 0)
      }

      return <StyledMask
        opacity={this.state.mask}
        aspectRatio={aspectRatio}
      >
        <h1>{prompt}!</h1>
        <button
          onMouseUp={this.newDeal}
        >
          {replay}
        </button>
      </StyledMask>

    } else {
      return ""
    }
  }


  render() {
    const aspectRatio = this.props.aspectRatio
    if (!this.props.view_data || !aspectRatio) {
      // Force the gameFrame ref to become something
      return <StyledGame
        ref={this.gameFrame}
      />
    }

    const itemCount = this.itemCount(aspectRatio)
    const complete  = this.props.completed < itemCount
                    ? 0
                    : + new Date()
    const layout    = this.props.view_data[itemCount]
    const frames    = this.getFrames(layout, aspectRatio)
    const names     = this.getNames(layout, aspectRatio)
    const newGame   = this.newGame(complete, aspectRatio)

    return (
      <StyledGame
        id="game-layout"
        aspectRatio={aspectRatio}
        ref={this.gameFrame}
      >
        {frames}
        <StyledNames
          onMouseDown={this.startDrag}
          onTouchStart={this.startDrag}
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
  let imageSelect    = { type: { $eq: key }}
  const folderSelect = { key:  { $eq: key }}
  const items = Drag.find(imageSelect).fetch()

  const images = items.map(document => [ document.file
                                       , document.text[code]
                                       ]
                          )
  const folder = Drag.findOne(folderSelect).folder

  // view_data
  const select  = { _id: Session.get("group_id") }
  const project = { fields: { view_data: 1, logged_in: 1 } }
  const { view_data, logged_in } = Groups.findOne(select, project)
  const completed = view_data
                  ? turnCompleted(view_data.show)
                  : false
  const isMaster  = logged_in
                  ? logged_in[0] === Session.get("d_code")
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
  , isMaster
  , completed
  , phrases
  }
})(Dragger)
