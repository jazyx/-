/**
 * import/ui/connect/Styles.jsx
 *
 */

import styled, { css } from 'styled-components'
import { tweenColor } from '../../core/utilities'

const colours = {
  background: "#000"
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

export const StyledUL = styled.ul`
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

export const StyledTeacher = styled.li`
  position: relative;
  width: 50vmin;
  height: 50vmin;
  margin: 0 25vmin;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: ${props => props.selected
                    ? 1
                    : 0.3333
            };

  & img {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10vmin!important;
    opacity: 1!important;
    ;
  }

  & p {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    color: #fff;
    // text-shadow: 2px 2px 2px #000000, -2px -2px 2px #000000;
    background: rgba(0,0,0,0.1);
    text-align: center;
    font-size: 7.5vmin;
    margin: 0;
  }

  &:hover {
    opacity: ${props => props.selected
                      ? 1
                      : 0.6667
              };
  }

  @media (min-aspect-ratio: 1/1) {
    display: inline-block;
    clear: both;
    margin: 0;
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
                      : 0.6667
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

export const StyledNavArrow = styled.div`
  width: 15vw;
  height: 15vw;
  background-color: #333;

  ${props => (props.disabled || props.invisible)
           ? `opacity: ${props.invisible ? 0 : 0.5};
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

export const StyledCentred = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
`