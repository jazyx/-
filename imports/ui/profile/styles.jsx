/**
 * import/ui/profile/Styles.jsx
 *
 */

import styled, { css } from 'styled-components'
import { tweenColor } from '../../tools/utilities'

const colors = {
  background: "#000"
}
colors.active = tweenColor(colors.background, "#fff", 0.1)


// On Android, the page may be shown full screen but with the address
// bar covering the top part of the page. For this reason, the prompt
// header is given a top margin of calc(10 * var(--h)), so that it is visible at all
// times.

export const StyledProfile = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: calc(100 * var(--h));
  width: calc(100 * var(--v));
  // background-color: ${colors.background};
  // pointer-events: none;
`

export const StyledPrompt = styled.h1`
  display: flex;
  align-items: center;
  height: calc(20 * var(--min));
  font-size: calc(8 * var(--min));
  text-align: center;
  margin: calc(10 * var(--h)) 0 calc(2 * var(--h));
  color: #fff;
`

export const StyledUL = styled.ul`
  list-style-type: none;
  width: calc(100 * var(--w));
  height: calc(88 * var(--h) - 35 * var(--w));
  padding: 0;
  margin: 0;
  text-align: center;
  overflow-y: auto;

  ${props => (props.aspectRatio > 1)
   ? `height: calc(53 * var(--h));
      white-space: nowrap;
     `
   : ""
  }
`

export const StyledTeacher = styled.li`
  position: relative;
  width: calc(50 * var(--min));
  height: calc(50 * var(--min));
  margin: 0 calc(25 * var(--min));
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: ${props => props.selected
                    ? 1
                    : 0.3333
            };
  cursor: pointer;

  & img {
    position: absolute;
    bottom: 0;
    right: 0;
    width: calc(10 * var(--min))!important;
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
    font-size: calc(7.5 * var(--min));
    margin: 0;
    pointer-events: none;
  }

  &:hover {
    opacity: ${props => props.selected
                      ? 1
                      : 0.6667
              };
  }

  ${props => (props.aspectRatio > 1)
   ? `display: inline-block;
      clear: both;
      margin: 0;
     `
   : ""
   }
`

export const StyledLI = styled.li`
  cursor: pointer;

  & img {
    width: calc(30 * var(--w));
    opacity: ${props => props.selected
                      ? 1
                      : 0.3333
              };
  }

  &:hover img {
    opacity: ${props => props.selected
                      ? 1
                      : 0.6667
              };
  }

  &:hover {
    background-color: ${colors.active};
  }

  ${props => (props.aspectRatio > 1)
   ? `display: inline-block;
      clear: both;
      height: calc(53 * var(--h) - 20px);

      & img {
        position: relative;
        top: calc(10 * var(--h));
        width: calc(33 * var(--h));
      }
     `
   : ""
  }
`

export const StyledInput = styled.input`
  font-size: calc(8 * var(--min));
  width: calc(70 * var(--min));
`

export const StyledButton = styled.button`
  background: transparent;
  border-radius: calc(10 * var(--h));
  padding: 0.1em 1em;
  color: #fff;
  height: calc(15 * var(--min));
  width: calc(70 * var(--w));
  max-width: calc(70 * var(--h));
  font-size: calc(5.25 * var(--min));
  ${props => props.disabled
           ? `opacity: 0.25;
              pointer-events: none;
             `
           : `cursor: pointer;`
   }

  &:active {
    background: ${colors.active};
  }
`

export const StyledNavArrow = styled.div`
  width: calc(15 * var(--min));
  height: calc(15 * var(--min));
  background-color: #333;

  ${props => (props.disabled || props.invisible)
           ? `opacity: ${props.invisible ? 0 : 0.5};
              pointer-events: none;
             `
           : `cursor: pointer;
             `
   }
`

export const StyledButtonBar = styled.div`
  display:flex;
  justify-content: space-between;
  height: calc(15 * var(--min));
  width: calc(100 * var(--w));
  border-top: 1px outset #222;
`

export const StyledCentred = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100 * var(--h));
  text-align: center;
`

export const StyledLearner = styled.li`
  border-color: #888;
  border-style: outset;
  border-width: calc(0.5 * var(--min));
  background-color: #111;
  color: #999;
  cursor: pointer;

  ${props => props.selected
           ? `border-color: #898;
              border-style: inset;
              color: #fff;
              background-color: #020;
             `
           : ``
   }

  ${props => props.disabled
           ? `border-color: #333;
              border-style: solid;
              border-width: calc(0.25 * var(--min));
              background-color: transparent;
              color: #333;
              pointer-events: none;
             `
           : ``
   }
  border-radius: calc(10 * var(--min));
  box-sizing: border-box;
  font-size: calc(8 * var(--min));
  padding: calc(1 * var(--min));
  width: calc(90 * var(--min));
  margin: auto;

  & p {
    margin: 0;
  }
`

export const StyledPIN = styled.p`
  font-size: calc(20 * var(--min));
  text-align: center;
  margin: 0
`

export const StyledP = styled.p`
  font-size: calc(5 * var(--min));
  text-align: center;
`


// NOT YET USED
export const StyledCheckbox = styled.label`
`

export const StyledRadioButtonGroup = styled.label`
`

export const StyledRadioButton = styled.label`
`