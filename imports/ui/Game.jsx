/**
 * Game.jsx
 */


import React, { Component } from 'react';
import styled, { css } from 'styled-components'
import { shuffle } from '../core/utilities'
import Sampler from '../core/sampler'


const data = {
  "folder": "/img/items/"
, "type": ".jpg"
, "items": [
    "armchair"
  , "bin"
  , "bookcase"
  , "chair"
  , "chest_of_drawers"
  , "clock"
  , "cushions"
  , "desk"
  , "dishwasher"
  , "fridge"
  , "lamp"
  , "microwave_oven"
  , "mirror"
  , "phone"
  , "photo"
  , "radiator"
  , "sofa"
  , "table"
  , "television"
  , "wardrobe"
  , "washing_machine"
  ]
}


const StyledFrame = styled.div`
  width: 50vw;
  height: 29vh;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  float: left;

  @media (min-aspect-ratio: 3/5) {
    height: 42vh;

    &:nth-child(5), &:nth-child(6) {
      display: none;
    }
  }

  @media (min-aspect-ratio: 5/4) {
    // background-color: blue;
    width: 33.3333vw;

    &:nth-child(5), &:nth-child(6) {
      display: flex;
    }
  }

  @media (min-aspect-ratio: 3/2) {
    width: 33.3333vw;
    height: 88vh;

    &:nth-child(4), &:nth-child(5), &:nth-child(6) {
      display: none;
    }
  }
`

const StyledSquare = styled.div`
  width: 48vw;
  height: 48vw;
  margin: 1vw 0 0;
  background: url(${props => props.src});
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;

  @media (min-aspect-ratio: 3/5) {
    height: 36vh;
  }

  @media (min-aspect-ratio: 3/2) {
    width: 32vw;
    height: 66.66667vh;
  }
`

const StyledName = styled.p`
  width: 96%;
  height: 1.4em;
  margin: 0;
  text-align: center;
  box-sizing: border-box;
  
  font-size: 2.5vh;
  margin: 0.15em 0 0;
  ${props => props.show
    ? `border: none;
       opacity: 1;`
    : `border: 2px dashed #999;
       color: #fff;`
  };

  @media (min-aspect-ratio: 3/5) {
    font-size: 4vh;
  }

  @media (min-aspect-ratio: 3/2) {
    font-size: 6vh;
  }
`

const StyledNames = styled.div` 
  position: fixed;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-column-gap: 0px;
  grid-row-gap: 0px;
  width: 100%;
  text-align: center;

  & p {
    height: 3.5vh;
    margin: 0;
  }

  /// 2 x 2 LAYOUT ///
  @media (min-aspect-ratio: 3/5) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    height: 12vh;
    font-size: 4vh;

    & p:nth-child(1), & p:nth-child(2) {   
      grid-row-start: 1;
    }

    & p:nth-child(3), & p:nth-child(4) {   
      grid-row-start: 2;
    }

    & p:nth-child(5), & p:nth-child(6) {
      display: none;
    }
  }

  /// 3 x 2 LAYOUT ///
  @media (min-aspect-ratio: 5/4) {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);

    & p:nth-child(5), & p:nth-child(6) {
      display: block;
    }
  }

  /// 3 x 1 LAYOUT ///
  @media (min-aspect-ratio: 3/2) {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(1, 1fr);
    height: 10vh;
    font-size: 6vh;

    & p:nth-child(4), & p:nth-child(5), & p:nth-child(6) {
      display: none;
    }

    & p:nth-child(1), & p:nth-child(2), & p:nth-child(3) {
      display: block;
      grid-row-start: 1;
    }
  }
}

`


export default class Game extends Component {
  constructor(props) {
    super(props)

    this.sampler = new Sampler({ array: data.items, sampleSize: 6 })
    const { layouts, show } = this._newDeal(true)

    this.state = {
      layouts
    , show
    , count: this._itemCount()
    , turn: 0
    }

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
    const items = this.sampler.getSample()
    const layouts = this._getLayouts(items)
    const show  = {}
    layouts[6].hints.forEach(hint => { show[hint] = false })

    if (startUp) {
      return { layouts, show }
    }

    const turn = this.state.turn + 1
    this.setState({ layouts, show, turn })
  }


  _getLayouts(items) {
    const layouts = { 3: 0, 4: 0, 6: 0 }
    const counts = Object.keys(layouts)

    counts.forEach(count => {
      let names = items.slice(0, count) // The first 3 are always shown
      const images = shuffle(names.slice(0))

      const hints = images.map(name => name.replace(/_/g, " "))
      names       = names .map(name => name.replace(/_/g, " "))

      layouts[count] = {
        images
      , hints
      , names
      }
    })

    return layouts
  }


  _itemCount() {
    const rect = document.body.getBoundingClientRect()
    const ratio = rect.width / rect.height
    let count = 3

    if (ratio < 3/5) {
      count = 6
    } else if (ratio < 5/4) {
      count = 4
    } else if (ratio < 3 / 2) {
      count = 6
    }

    return "" + count
  }


  render() {
    const layout = this.state.layouts[this.state.count]
    console.log(this.state.show)

    const images = layout.images.map((item, index) => {
      const src = data.folder + item + data.type
      const hint = layout.hints[index]
      const show = this.state.show[hint]
      console.log("hint:", hint, "show:", show)

      return <StyledFrame
        key={"frame"+index}
      >
        <StyledSquare
          key={item}
          src={src}
        />
        <StyledName
          show={show}
          key={hint + "hint"}
        >
          {hint}
        </StyledName>
      </StyledFrame>
    })

    const names = layout.names.map((name, index) => {
      return <p
        key={index}
      >
        {name}
      </p>
    })

    return (
      <div className="IMAGES">
        {images}  
        <StyledNames>
          {names}
        </StyledNames>
      </div>
    )
  }
}
