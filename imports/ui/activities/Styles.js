/**
 * import/ui/activities/Styles.jsx
 *
 */

import styled, { css } from 'styled-components'
import { tweenColor } from '../../core/utilities'

const colours = {
  background: "#010"
}
colours.active = tweenColor(colours.background, "#fff", 0.1)


export const StyledProfile = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100vh;
  background-color: ${colours.background};
`

export const StyledPrompt = styled.h1`
  display: flex;
  align-items: center;
  text-align: center;
  height: 10vmin;
  font-size: 8vmin;
  margin: 2.5vmin 0 2.5vmin;

  @media (min-aspect-ratio: 1/1) {
    white-space: nowrap;
  }
`

export const StyledActivities = styled.ul`
  list-style-type: none;
  width: 100%;
  height: calc(100vh - 45vw);
  margin: 0;
  padding: 0;
  text-align: center;
  overflow-y: auto;

  @media (min-aspect-ratio: 1/1) {
    white-space: nowrap;
    height: 50vh;
  }
`

export const StyledDescription = styled.p`
  height: 18vmin;
  width: 100%;
  margin: 0;
  font-size: 3.75vmin;
  box-sizing: border-box;
  padding: 0.25em;
  margin: 0 0 2vmin;
  overflow-y: auto;
`

export const StyledActivity = styled.li`
  position: relative;
  width: calc(50vw - 10px);
  height: calc(50vw - 10px);
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: ${props => props.selected
                    ? 1
                    : 0.3333
            };
  & p {
    position: absolute;
    background: rgba(0,0,0,0.25);
    top: 0;
    left: 0;
    width: 100%;
    font-size: 5vmin;
    text-align: center;
    margin: 0;
  }

  @media (max-aspect-ratio: 1/1) {
    float: left;
  }

  @media (min-aspect-ratio: 1/1) {
    width: calc(50vh - 20px);
    height: calc(50vh - 20px);
    display: inline-block;
    clear: both;
  }
`

export const StyledButton = styled.button`
  background: transparent;
  border-radius: 10vh;
  padding: 0.1em 1em;
  color: #fff;
  height: 15vw;
  width: 70vw;
  max-width: 70vh;
  font-size: 5.25vw;
  ${props => props.disabled
           ? `opacity: 0.25;
              pointer-events: none;
             `
           : `cursor: pointer;`
   }

  &:active {
    background: ${colours.active};
  }

  @media (min-aspect-ratio: 1/1) {
    height: 15vh;
    font-size: 5.25vh;
  }
`
