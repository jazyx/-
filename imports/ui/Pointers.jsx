/**
 * /import/ui/Points.jsx
 *
 */


import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import Points
     , { createTracker
       , update
       , destroyTracker
     } from '../api/points'
import { toneColor
       , translucify
       , getColor
       , getXY
       } from '../tools/utilities'
import { Circle
       , Mouse
       , Touch
       } from './img/svg'


// Pointers gets re-instantiated, so all its internal properties get
// reset
let instance = 0
let render = 0


class Pointers extends Component {
  constructor(props) {
    super(props)

    // console.log("Pointers instance:", instance += 1)

    this.groupIsActive   = false
    this.pointerIsActive = false
    this.pointer_id      = false
    this.lastTouch = {}

    this.tap = this.tap.bind(this)
    this.setPointerId = this.setPointerId.bind(this)
    this.trackPoint = this.trackPoint.bind(this)

    this.style = {
      position: "fixed"
    , top: 0
    , left: 0
    , width: "100vw"
    , height: "100vh"
    , pointerEvents: "none"
    , backgroundColor: "rgba(0,0,255, 0.15)"
    }

    document.body.addEventListener("touchmove", this.trackPoint,false)
    document.body.addEventListener("mousemove", this.trackPoint,false)
    document.body.addEventListener("touchstart",this.tap, false)
    document.body.addEventListener("touchend",  this.tap, false)
    document.body.addEventListener("mousedown", this.tap, false)
    document.body.addEventListener("mouseup",   this.tap, false)
  }


  pointMethod(event) {
    // console.log("Points received", event.type, "from", event.target)
  }


  syncActive() {
    if (this.props.active) {
      if (!this.groupIsActive) {
        this.groupIsActive = true
        this.createTracker()

        return 1
      }
    } else if (this.groupIsActive) {
      this.groupIsActive = false
      this.destroyTracker()

      return -1
    }

    return 0
  }


  createTracker() {
    const _id = Session.get("d_code")
    const color = Session.get("q_color")
    const group_id = this.props.group_id

    // console.log("createTracker: _id", _id
    //            , "color:", color
    //            , "group_id:", group_id
    //            )

    createTracker.call({ _id, color, group_id }, this.setPointerId)
  }


  destroyTracker() {
    const _id = this.pointer_id
    const group_id = this.props.group_id
    destroyTracker.call({ _id, group_id }, this.setPointerId)
  }


  setPointerId(error, pointer_id) {
    if (!error) {
      this.pointer_id = pointer_id // === d_code | false
    }
  }


  getPointData(event) {
    let data
    const { top, left, width, height } = this.props.rect

    const touchend = event.type === "touchend"

    if (touchend) {
      data = this.lastTouch
      data.active = false
      data.touchend = true

    } else {
      const _id = this.pointer_id
      const group_id = this.props.group_id
      const active = this.pointerIsActive
      // Get x and y relative to the whole window...
      let { x, y } = getXY(event)
      // ... then adjust to fit the Share rect
      x = Math.max(0, Math.min( ( x - left ) / width, 1 ))
      y = Math.max(0, Math.min( ( y - top ) / height, 1 ))

      data = {
        _id
      , group_id
      , x
      , y
      , active
      , touchend
      }

      if (event.type.startsWith("touch")) { // ~start, ~move
        const { radiusX, radiusY, rotationAngle } = event.touches[0]
        data.touch = { radiusX, radiusY, rotationAngle }
      }

      this.lastTouch = Object.assign({}, data)
    }

    return data
  }


  trackPoint(event) {
    if (!this.pointer_id) {
      return
    }

    const data = this.getPointData(event)
    update.call(data)
  }


  tap(event) {
    if (!this.pointer_id) {
      return
    }

    this.pointerIsActive = event.type === "mousedown"
                        || event.type === "touchstart"
    const data = this.getPointData(event)
    update.call(data)
  }


  getStatus(scale) {
    if (!this.props.points.length){
      // Hide the TurnCircle
      return ""
    }

    const inactive = this.props.points.every(doc => !doc.active)
    const fill = inactive
               ? "090"
               : "c90"
    const style = {
      position: "absolute"
    , top: 0
    , right: 0
    , width: "10vmin"
    , height: "10vmin"
    , opacity: 0.2
    , fill
    }
    return <Circle
      style={style}
    />
  }


  getPoints(scale) { // window.devicePixelRatio
    // Get the dimensions of the rendered area, so we can use them to
    // convert the relative position of the pointer...
    //   ( 0.0 ≤ doc.x, doc.y ≤ 1.0)
    // ... to absolute values.

    const { width: w, height: h} = this.props.rect

    return this.props.points
                     .filter(doc => (
                      //    !doc.touchend
                      // && !isNaN(doc.x)
                      // &&
                        doc._id !== this.pointer_id
                      ))
                     .map(doc => {
      let top  = Math.max(0, Math.min(doc.y * h, h - 2))
      let left = Math.max(0, Math.min(doc.x * w, w - 1))
      let width
        , height
        , shadow
      const touch = doc.touch
      if (touch) {
        width = Math.max(15, touch.radiusX)  // actually, use only
        height = Math.max(20, touch.radiusY) // half the value first
        left   = left - width + "px"
        top    = top - height + "px"
        width  = width * 2 + "px"            // and then
        height = height * 2 + "px"           // double it
        shadow = ""
      } else {
        width  = 12 * scale + "px"
        height = 16 * scale + "px"
        left   = left + "px"
        top    = top + "px"
        shadow = "drop-shadow(0 0 6px #f90)"
      }
      const edge = doc.color
      const inner = toneColor(edge, 1.5)
      const opacity = 0.5
      const [ stroke
            , fill
            , filter
            , zIndex
            ] = doc.active
              ? [ edge
                , inner
                , shadow
                , 999
                ]
              : [ translucify(edge, opacity)
                , translucify(inner, opacity)
                , ""
                , 0
                ]
      const style = {
        position: "absolute"
      , left
      , top
      , width
      , height
      , fill
      , stroke
      , filter
      , zIndex
      }

      if (touch) {
        return <Touch
          key={doc._id}
          style={style}
        />

      } else {
        return <Mouse
          key={doc._id}
          style={style}
        />
      }
    })
  }


  render() {
    // console.log("Share this.props:", this.props)
    // console.log("Render:", render += 1)
    const activeChange = this.syncActive()

    const scale = 1 // window.devicePixelRatio
    const status = this.getStatus()
    const points = this.getPoints(scale)


    // console.log("Pointers activeChange", activeChange, points.length)

    return <div
      id="points"
      style={{
        position: "absolute"
      , height: "100%"
      , width: "100%"
      , top: "0"
      , left: "0"
      , backgroundColor: "rgba(204, 0, 204, 0.1)"
      , pointerEvents: "none"
      }}
    >
      {status}
      {points}
    </div>
  }
}


let track = 0

export default withTracker(() => {
  // console.log("Pointer track:", track += 1)

  const group_id = Session.get("group_id")

  // Groups .active is true
  // * If this is a Community group
  // * If the Teacher is logged in to a Teacher-managed group

  let active   = groupIsActive(group_id)
  const points = group_id && active
               ? Points.find({ group_id }).fetch()
               : []
  // console.log("Points active:", active)

  // points will be [] if there is no group_id; there will be no
  // group_id if the user has not completed the basic choices yet, or
  // if no data was saved to localStorage after an earlier session.
  // If it is not empty, points will be...
  // [ { _id:      <d_code>
  //   , color:    <#hex>
  //   , group_id: "longHashString "
  //   }
  // , ...
  // ]
  // ... with an entry for each d_code in group .logged_in

  return {
    group_id
  , active
  , points
  }
})(Pointers)


function groupIsActive(_id) {
  const select  = { _id }
  const project = { fields: { active: 1 } }
  const active  = (Groups.findOne(select, project) || {}).active

  return active || false
}