/**
 * import/ui/activities/Styles.jsx
 *
 */

import styled, { css } from 'styled-components'
import { tweenColor } from '../../tools/utilities'

const colours = {
  background: "#010"
}
colours.active = tweenColor(colours.background, "#fff", 0.1)


export const StyledProfile = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: ${props => props.units.uh * 100}px;
  background-color: ${colours.background};
`

export const StyledPrompt = styled.h1`
  display: flex;
  align-items: center;
  text-align: center;
  height: ${props => props.units.umin * 10}px;
  font-size: ${props => props.units.umin * 8}px;
  margin: ${props => props.units.umin * 2.5}px
          0
          ${props => props.units.umin * 2.5}px;
`

export const StyledActivities = styled.ul`
  list-style-type: none;
  width: ${props => props.units.uv * 100}px;
  margin: 0;
  padding: 0;
  text-align: center;
  overflow-y: auto;

  ${props => props.units.wide
           ? `white-space: nowrap;
              height: ${props.units.uh * 50}px;
             `
           : ""
  }}
`

export const StyledDescription = styled.p`
  height: ${props => props.units.umin * 18}px;
  width: 100%;
  margin: 0;
  font-size: ${props => props.units.umin * 3.75}px;
  box-sizing: border-box;
  padding: 0.25em;
  margin: 0 0 ${props => props.units.umin * 2.5}px;
  overflow-y: auto;
`

export const StyledActivity = styled.li`
  position: relative;
  width: ${props => (
    props.units.uv * 50 - 10
  )}px;
  height: ${props => (
    props.units.uv * 50 - 10
  )}px;

  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  cursor: pointer;
  ${props => props.disabled
           ? `opacity: 0.1333;
              pointer-events: none;
              cursor: default;
             `
           : props.selected
             ? `opacity: 1`
             : `opacity: 0.6667`
   };
  & p {
    position: absolute;
    background: rgba(0,0,0,0.25);
    top: 0;
    left: 0;
    width: 100%;
    font-size: ${props => props.units.umin * 5}px;
    text-align: center;
    margin: 0;
  }

  ${props => props.units.wide
           ? ""
           : `float: left;`
  }}

  /* Using 22px as the height for the horizontal scrollbar */
  ${props => props.units.wide
           ? `width: ${props.units.uh * 50 - 22}px;
              height: ${props.units.uh * 50 - 22}px;
              display: inline-block;
              clear: both;
             `
           : ""
   }
`

export const StyledButton = styled.button`
  background: transparent;
  border-radius: 10vh;
  padding: 0.1em 1em;
  color: #fff;
  height: ${props => props.units.uv * 16}px;
  width: ${props => props.units.uv * 70}px;
  max-width: ${props => props.units.uh * 70}px;
  font-size: ${props => props.units.uv * 5.25}px;
  ${props => props.disabled
           ? `opacity: 0.25;
              pointer-events: none;
             `
           : `cursor: pointer;`
   }

  &:active {
    background: ${colours.active};
  }

  ${props => props.units.wide
           ? `height: ${props.units.uh * 15}px;
              font-size: ${props.units.uh* 5.25}px;
             `
           : ""
  }}
`
