import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data'
import styled, { css } from 'styled-components'

import { Spiral } from '/imports/api/collections';
import { setStart } from './methods'


const phi   = (1 + Math.sqrt(5)) / 2
const thick = 100 / phi
const thin  = (100 - thick)



const StyledMain = styled.main`
  ${props => console.log(props)}
  position: relative;
  border: 1px solid #fff;
  box-sizing: border-box;

  ${props => {
    if (props.aspectRatio < 1000/1618) {
      return `width: calc(100 * var(--w));
              height: calc(${phi * 100} * var(--w));
             `
    } else if (props.aspectRatio < 1) {
      return `height: calc(100 * var(--h));
               width: calc(${thick} * var(--h));
             `
    } else if (props.aspectRatio < 1618/1000) {
      return `width: calc(100 * var(--w));
              height: calc(${thick} * var(--w));
             `
    } else {
      return `height: calc(100 * var(--h));
              width: calc(${phi * 100} * var(--h));
             `
    }
  }}
`


const StyledFrame = styled.div`
  position: absolute;
  box-sizing: border-box;
  left: ${props => props.left};
  top: ${props => props.top};

  width: ${props => props.width || "100%"};
  height: ${props => props.height || "50%"};

  ${props => {
    if (props.lead) {
      return ""
    }
    switch (props.position) {
      case "top":
        return "border-bottom: 1px solid #fff"
      case "left":
        return "border-right: 1px solid #fff"
      case "right":
        return "border-left: 1px solid #fff"
      case "bottom":
        return "border-top: 1px solid #fff"
    }
  }}
`


const StyledImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;

  ${props => {
    switch (props.place) {
      case "top":
        return `
          height: ${thick}%;
        `
      case "left":
        return `
          width: ${thick}%;
        `
      case "right":
        return `
          width: ${thick}%;
          left: ${thin}%;
        `
      case "bottom":
        return `
          height: ${thick}%;
          top: ${thin}%;
        `
    }
  }}
`



const Frame = (props) => (
  <StyledFrame
    className={
      "aspect-"+props.aspect
     + " " + "position-"+props.position
     + " " + "place-"+props.place
    }
    top={props.top}
    lead={props.lead}
    left={props.left}
    place={props.place}
    width={props.width}
    height={props.height}
    aspect={props.aspect}
    position={props.position}
    deleteME={props.src}
  >
    <StyledImage
      src={props.src}
      lead={props.lead}
      place={props.place}
    />
    {props.children}
  </StyledFrame>
)



class App extends Component {
  constructor(props) {
    super(props)

    this.levels = 14
    this.imagesLoaded = false

    this.setStart = this.setStart.bind(this)

    this.state = {
     righthanded: true
    , imagesLoaded: false
    }

    if (this.props.isMaster) {
      this.setStart()
    }
  }


  preloadImages() {
    const imagesLoaded = true
    setTimeout(() => this.setState({ imagesLoaded }), 0)
  }


  setStart(event) {
    const index = this.props.start
    const total = this.props.total
    let start   = 0

    if (event) {
      let element = event.target.parentNode // IMG > DIV

      while(element = element.parentNode){
        if (element.tagName === "MAIN") {
          break
        }
        start += 1
      }

      if (!start) { // going backwards, possibly through item 0
        start += (index + total - 1) % total
      } else {
        start += index % total
      }
    }

    const setStartData  = {
      group_id: Session.get("group_id")
    , start
    }

    setStart.call(setStartData)
  }


  getImages() {
    const images = []

    const source = this.props.images
    const total  = source.length
    const start  = this.props.start
    let ii = this.levels

    for ( ii ; ii-- ; ) {
      const index = (start + ii) % total
      images.push(this.props.images[index])
    }

    return images
  }


  cycle(array) {
    const item = array.shift()
    array.push(item)
    return item
  }


  getLoc(aspect, position, lead) {
    let top
      , left

    if (aspect === "landscape") {
      switch (position) {
        case "top":
          top = "0;"
          left = "0;"
        break
        case "bottom":
          left = "0;"
          top = lead
              ? 0
              : thick +"%"
      }

    } else { // right-handed portrait
      switch (position) {
        case "right":
          top = "0;"
          left = lead
               ? 0
               : thick + "%"
        break
        case "left":
          left = "0;"
          top = "0;"
      }
    }

    return {
      top
    , left
    }
  }


  getFrames() {
    const folder = this.props.folder
    const images = this.getImages()
    const last   = images.length - 1
    let aspects
      , positions
      , places
    if ( this.landscapeMode) {
      aspects   = ["portrait", "landscape"]
      if (this.state.righthanded) {
        positions = ["right", "bottom", "left", "top"]
        places    = ["bottom", "left", "top", "right"]
      } else {
        positions = ["left", "bottom", "right", "top"]
        places    = ["bottom", "right", "top", "left"]
      }
    } else { // portrait
      aspects = ["landscape", "portrait"]
      if (this.state.righthanded) {
        positions = ["bottom", "right", "top", "left"]
        places    = ["right", "top", "left", "bottom"]

      } else {
        positions = ["bottom", "left", "top", "right"]
        places    = ["left", "top", "right", "bottom"]
      }
    }

    let frame = ""

    images.forEach((imageData, index) => {
       const src      = folder + imageData.file
       const aspect   = this.cycle(aspects)
       const position = this.cycle(positions)
       const place    = this.cycle(places)
       const lead = (index ===  last)

       const { top, left } = this.getLoc(aspect, position, lead)
       const width  = (aspect === "landscape")
                    ? "100%"
                    : ( lead )
                      ? "100%"
                      : thin + "%"
       const height = (aspect === "landscape")
                    ? ( lead )
                      ? "100%"
                      : thin + "%"
                    : "100%"
       frame = <Frame
         src={src}
         top={top}
         left={left}
         lead={lead}
         width={width}
         height={height}
         aspect={aspect}
         position={position}
         place={place}
       >
         {frame}
       </Frame>
    })

    return frame
  }


  getMain() {
    const frames = this.getFrames()
    const main = <StyledMain
      onMouseUp={this.setStart}
      aspectRatio={this.props.aspectRatio}
    >
      {frames}
    </StyledMain>

    return main
  }


  render() {
    this.landscapeMode = this.props.aspectRatio > 1

    const total = this.props.images.length
    if (total < 20) {
      return <p>Loading...</p>

    } else if (!this.state.imagesLoaded) {
      this.preloadImages()
      return <p>Loading images...</p>
    }

    const main = this.getMain()
    return main
  }
}


export default withTracker(() => {
  const type = "anning"

  const typeSelect = { type }
  const images = Spiral.find(typeSelect).fetch()
  const total  = images.length

  const folderSelect = { key: type }
  const { folder } = Spiral.findOne(folderSelect)

  // console.log( "set: " + images.length + " images <<< db.spiral.find("
  //            + JSON.stringify(typeSelect)
  //            + ")"
  //            )

   // view_data
  const select  = { _id: Session.get("group_id") }
  const project = { fields: { view_data: 1, logged_in: 1 } }
  const { view_data, logged_in } = Groups.findOne(select, project)

  const isMaster  = logged_in
                  ? logged_in[0] === Session.get("d_code")
                  : false
  const start     = view_data
                  ? view_data.start
                  : 0
  return {
    images
  , folder
  , start
  , total
  , isMaster
  }
})(App)
