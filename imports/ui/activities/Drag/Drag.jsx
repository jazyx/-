/**
 * Drag.jsx
 */


import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';
import styled, { css } from 'styled-components'
import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { Drag } from '../../../api/collections'
import { shuffle
       , getPageXY
       , setTrackedEvents
       } from '../../../tools/utilities'
import Sampler from '../../../tools/sampler'

import { setViewData
       , toggleShow
       } from './methods'


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
  margin: 0;
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

    this._newDeal(true) // sets this.props.viewData

    this.dropTarget = React.createRef()
    this.gameFrame  = React.createRef()

    this.state = {
      count: 0
    , turn: 0
    , mask: 0
    }

    this._startDrag = this._startDrag.bind(this)
    this._newDeal = this._newDeal.bind(this)
    this._fadeMask = this._fadeMask.bind(this)
    this.resize = this.resize.bind(this)
    window.addEventListener("resize", this.resize, false)
  }


  resize() {
    const count = this._itemCount()
    if (count !== this.state.count) {
      this.setState({ count })
    }
  }


  _newDeal(startUp) {
    if (!Session.get("isMaster")) {
      return
    }

    const items = this.sampler.getSample()
    const viewData = this._getLayouts(items)
    viewData.show  = viewData[6].hints.reduce((show, hint) => {
      hint = this._hyphenate(hint)
      show[hint] = false
      return show
    }, {})
    const group_id = Session.get("group_id")

    setViewData.call({ group_id, viewData })

    if (startUp === true) {
      return // { viewData, show }
    }

    const turn = this.state.turn + 1
    const complete = 0
    const mask = 0
    this.setState({ /*viewData, show,*/ turn, complete, mask })
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


  _itemCount() {
    const gameFrame = this.gameFrame.current
    if (!gameFrame) {
      return 0
    }

    let count = 3
    const rect = gameFrame.getBoundingClientRect()
    const ratio = rect.width / rect.height

    if (ratio < 3/5) {
      count = 6
    } else if (ratio < 5/4) {
      count = 4
    } else if (ratio < 3 / 2) {
      count = 6
    }

    return "" + count
  }


  _startDrag(event) {
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

    // Highlight dragged element
    target.classList.add("drag")

    // Choose target
    const dropClass = this._hyphenate(target.innerText)
    this.setState({ dropClass })

    const { x: startX, y: startY } = getPageXY(event)

    const drag = (event) => {
      const { x, y } = getPageXY(event)
      target.style.left = (x - startX) + "px"
      target.style.top = (y - startY) + "px"

      this.lastX = x
      this.lastY = y
    }

    const drop = (event) => {
      setTrackedEvents(cancel)
      target.classList.remove("drag")

      if (isNaN(this.lastX)) {
        // The user just clicked and released, with no drag
        return
      }

      const elements = document.elementsFromPoint(
        this.lastX
      , this.lastY
      )
      if (elements.length < 3) {
        return
      }

      const onTarget = !(elements.indexOf(this.dropTarget.current)<0)

      target.style.removeProperty("left")
      target.style.removeProperty("top")

      if (onTarget) {
        target.classList.add("dropped")

        const show = this.props.viewData.show
        const showData = {
          group_id: Session.get("group_id")
        , hint: this.state.dropClass
        }
        toggleShow.call(showData)
      }

      this.setState({ dropClass: "" })
    }

    const cancel = setTrackedEvents({ event, drag, drop })
  }


  _hyphenate(expression) {
    return expression.replace(/ /g, "-")
  }


  _getFrames(layout) {
    const frames = layout.images.map((item, index) => {
      const src = this.props.folder + item
      const hint = layout.hints[index]
      const className = this._hyphenate(hint)
      const show = this.props.viewData.show[className]
      const ref = className === this.state.dropClass
                ? this.dropTarget
                : null

      return <StyledFrame
        key={"frame"+index}
        ref={ref}
        className={className}
        aspectRatio={this.props.aspectRatio}
      >
        <StyledSquare
          key={item}
          src={src}
          aspectRatio={this.props.aspectRatio}
        />
        <StyledName
          className="can-select"
          show={show}
          key={hint}
          aspectRatio={this.props.aspectRatio}
        >
          {hint}
        </StyledName>
      </StyledFrame>
    })

    return <StyledFrameSet
      aspectRatio={this.props.aspectRatio}
    >
      {frames}
    </StyledFrameSet>
  }


  _getNames(layout) {
    const names = layout.names.map((name, index) => {
      const show = !this.props.viewData.show[name]

      return <StyledDraggable
        key={index+"-"+name}
        show={show}
        aspectRatio={this.props.aspectRatio}
      >
        {name}
      </StyledDraggable>
    })

    return names
  }


  _fadeMask() {
    this.setState({ mask: 1 })
  }


  _newGame(complete) {
    if (complete) {
      if (!this.timeOut) {
        this.timeOut = setTimeout(this._fadeMask, 0)
      }

      return <StyledMask
        opacity={this.state.mask}
        aspectRatio={this.props.aspectRatio}
      >
        <h1>Congratulations!</h1>
        <button
          onMouseUp={this._newDeal}
        >
          Play again
        </button>
      </StyledMask>

    } else {
      return ""
    }
  }


  render() {
    if (!this.props.viewData || !this.state.count) {
      // Force the gameFrame ref to become something
      return <StyledGame
        ref={this.gameFrame}
      />
    }

    const complete = this.props.completed === this.state.count
                   ? + new Date()
                   : 0
    const layout = this.props.viewData[this.state.count]
    const frames = this._getFrames(layout)
    const names = this._getNames(layout)
    const newGame = this._newGame(complete)
    const aspectRatio = this.props.aspectRatio

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


  componentDidMount() {
    this.resize()
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
  const imageSelect  = { type: { $eq: key }}
  const folderSelect = { key:  { $eq: key }}
  const items = Drag.find(imageSelect).fetch()

  const images = items.map(document => [ document.file
                                       , document.text[code]
                                       ]
                          )
  const folder = Drag.findOne(folderSelect).folder

  // viewData
  const select  = { _id: Session.get("group_id") }
  const project = { fields: { viewData: 1 } }
  const { viewData } = Groups.findOne(select, project)
  const completed = viewData
                  ? turnCompleted(viewData.show)
                  : false

  // ... and add the extracted data to the Game instance's this.props
  return {
    images
  , folder
  , viewData
  , completed
  }
})(Dragger)
