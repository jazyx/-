import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import Points, { pointInsert,  pointUpdate } from '../api/points'



let instance = 0


class Pointers extends Component {
  constructor(props) {
    super(props)

    // console.log("Points instance", ++instance)

    this.state = { pointers: {} }
    this.streaming = false

    this.update        = this.update.bind(this)
    this.pointMethod   = this.pointMethod.bind(this)
    this.observePoints = this.observePoints.bind(this)
    this.pointerAdded  = this.pointerAdded.bind(this)
    this.pointerMoved  = this.pointerMoved.bind(this)
    this.pointerLeft   = this.pointerLeft.bind(this)

    this.style = {
      position: "fixed"
    , top: 0
    , left: 0
    , width: "100vw"
    , height: "100vh"
    , pointerEvents: "none"
    , backgroundColor: "rgba(0,0,255, 0.15)"
    }

    this.observePoints()
    document.body.addEventListener("mousemove",  this.update, false)
  }


  observePoints() {
    const group_id = this.props.group_id
    if (!group_id) {
      console.log("observePoints has no group_id")
      return
    }

    Meteor.subscribe(Points._name, "Points")
    const query = { group_id }
    const handle = Points.find(query).observe({
      added:   this.pointerAdded
    , changed: this.pointerMoved
    , removed: this.pointerLeft
    });
  }

  // { id:       { type: String }
  // , group_id: { type: String }
  // , x:        { type: Number }
  // , y:        { type: Number }
  // , active:   { type: Boolean }
  // , color
  // }

  pointerAdded(doc) {
    console.log("New pointer", doc)
  }


  pointerMoved(to, from) {
    const { colour, x, y } = to
    const pointers = this.state.pointers
    pointers[colour] = { x, y }
    this.setState({ pointers })
  }


  pointerLeft(doc) {
    console.log("Pointer lost", doc)
  }


  update(event) {
    if (!this.props.group_id || !this.props.id) {
      // There's no-one to share with yet
      return
    }

    const x = event.offsetX
    const y = event.offsetY
    const active = false
    let method

    if (this.streaming) {
      method = pointUpdate
    } else {
      method = pointInsert
      this.streaming = true
    }

    method.call({ 
      id: this.props.id
    , group_id: this.props.group_id
    , x
    , y
    , active
    })
  }


  pointMethod(event) {
    // console.log("Points received", event.type, "from", event.target)
  }


  render() {
    const pointers = this.state.pointers
    const colours  = Object.keys(pointers)
    const feedback = colours.reduce((array, colour, index) => {
      const { x, y } = pointers[colour]
      array.push(
        <p
          key={index}
        >
          {colour + " — x: " + x  + ", y: " + y}
        </p>
      )
      return array
    }, [])
    // const { x, y } = this.props.points[0] || {x: 0, y: 0}
    // const element = document.elementsFromPoint(x, y)[1] || {}
    // const type = element.tagName
    // const point = <p
    //   style={{zIndex: 99}}
    // >
    //   {`x: ${x}, y: ${y}, type: ${type}`}
    // </p>
    const point = "Hang on..."

    return <div
      id="points"
      ref={this.ref}
      style={this.style}
    >
      {feedback}
    </div>
  }
}



export default withTracker(() => {
  const id  = Session.get("teacher_id") || Session.get("user_id")
  const group_id = Session.get("group_id") || "fake_id"

  return {
    id
  , group_id
  // , points
  }
})(Pointers)
