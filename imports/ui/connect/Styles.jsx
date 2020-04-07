/**
 * import/ui/connect/Styles.jsx
 *
 */

import styled, { css } from 'styled-components'
import { tweenColor } from '../../core/utilities'

const colours = {
  background: "#003"
}
colours.active = tweenColor(colours.background, "#fff", 0.1)


// On Android, the page may be shown full screen but with the address
// bar covering the top part of the page. For this reason, the prompt
// header is given a top margin of 10vh, so that it is visible at all
// times.

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
  height: 20vw;
  font-size: 8vw;
  text-align: center;
  margin: 10vh 0 2vh;
  color: #fff;

  @media (min-aspect-ratio: 1/1) {
    height: 20vh;
    font-size: 8vh;
  }
`

export const StyledFlags = styled.ul`
  list-style-type: none;
  width: 100%;
  height: calc(88vh - 35vw);
  padding: 0;
  margin: 0;
  text-align: center;
  overflow-y: auto;

  @media (min-aspect-ratio: 1/1) {
    height: 53vh;
    white-space: nowrap;
  }
`

export const StyledLI = styled.li`
  & img {
    width: 30vw;
    opacity: ${props => props.selected
                      ? 1
                      : 0.25
              };
  }

  &:hover img {
    opacity: ${props => props.selected
                      ? 1
                      : 0.5
              };
  }

  &:hover {
    background-color: ${colours.active};
  }

  @media (min-aspect-ratio: 1/1) {
    display: inline-block;
    clear: both;
    height: calc(53vh - 20px);

    & img {
      position: relative;
      top: 10vh;
      width: 33vh;
    }
  }
`

export const StyledInput = styled.input`
  font-size: 8vmin;
  width: 70vmin;
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
  cursor: pointer;

  &:active {
    background: ${colours.active};
  }

  @media (min-aspect-ratio: 1/1) {
    height: 15vh;
    font-size: 5.25vh;
  }
`

export const StyledNavArrow = styled.div`
  width: 15vw;
  height: 15vw;
  background-color: #888;

  ${props => (props.disabled || props.invisible)
           ? `opacity: ${props.invisible ? 0 : 0.25};
              pointer-events: none;
             `
           : `cursor: pointer;
             `
   }


  @media (min-aspect-ratio: 1/1) {
    width: 15vh;
    height: 15vh;  
  }
`


export const StyledButtonBar = styled.div`
  display:flex;
  justify-content: space-between;
  height: 15vw;
  width: 100vw;

  @media (min-aspect-ratio: 1/1) {
    height: 15vh;  
  }
`