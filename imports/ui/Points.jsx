/**
 * /import/ui/Points.jsx
 * 
 */


import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import Points, { createTracker, update } from '../api/points'
import { toneColor
       , translucify
       , getColor
       , getXY
       } from '../tools/utilities'
import { Circle
       , Mouse
       , Touch
       } from './img/svg'



class Pointers extends Component {
  constructor(props) {
    super(props)

    this.isActive = false
    this.tap = this.tap.bind(this)
    this.callback = this.callback.bind(this)
    this.trackPoint = this.trackPoint.bind(this)

    this.state = { pointers: {} }

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
    console.log("Points received", event.type, "from", event.target)
  }


  createTracker() {
    const group_id = this.props.group_id
    const query = { group_id }
    createTracker.call(this.callback)
  }


  callback(error, user_id) {
    if (!error) {
      this.user_id = user_id
    }
  }


  getPointData(event) {
    const touchend = event.type === "touchend"

    const data = {
      _id: this.user_id
    , group_id: "test"
    , active: this.isActive
    , touchend
    }

    if (!touchend) {
      const { x, y } = getXY(event)
      data.x = x
      data.y = y

      if (event.type.startsWith("touch")) {
        const { radiusX, radiusY, rotationAngle } = event.touches[0]
        data.touch = { radiusX, radiusY, rotationAngle }
      }
    }

    return data
  }


  trackPoint(event) {
    if (!this.props.points.length) {
      return
    }

    const data = this.getPointData(event)
    update.call(data)
  }


  tap(event) {
    if (!this.props.points.length) {
      return
    }

    this.isActive = event.type === "mousedown"
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
    return this.props.points
                     .filter(doc => (
                         !doc.touchend
                      && !isNaN(doc.x)
                      && doc._id !== this.user_id
                      ))
                     .map(doc => {
      let top
        , left
        , width
        , height
        , shadow
      const touch = doc.touch
      if (touch) {
        width = Math.max(15, touch.radiusX)
        height = Math.max(20, touch.radiusY)
        left   = doc.x - width / 2 + "px"
        top    = doc.y - height / 2 + "px"
        width  = width * 2 + "px"
        height = height * 2 + "px"
        shadow = ""
      } else {
        width  = 12 * scale + "px"
        height = 16 * scale + "px"
        left   = doc.x + "px"
        top    = doc.y + "px"
        shadow = "drop-shadow(0 0 6px #f90)"
      }
      const edge = getColor({ number: doc.number, format: "hex" })
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
    const scale = 1 // window.devicePixelRatio
    const status = this.getStatus()
    const points = this.getPoints(scale)

    return <div
      id="points"
      style={{
        height: "100vh"
      , backgroundColor: "#ccc"
      }}
    >
      {status}
      {points}
    </div>
  }
}



export default withTracker(() => {
  const id       = Session.get("teacher_id") || Session.get("user_id")
  const group_id = Session.get("group_id")
  const points   = group_id
                 ? Points.find({ group_id }).fetch()
                 : []

  // points will be [] if there is no group_id; there will be no
  // group_id if the user has not completed the basic choices yet, or
  // if no data was saved to localStorage after an earlier session.
  // trackPoint() and tap() will not run until group_id is set.

  return { 
    id
  , group_id
  , points
  }
})(Pointers)
