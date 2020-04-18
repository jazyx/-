/**
 * utilities.js
 *
 * Provides a set of re-usable functions which can be imported
 * anywhere
 */


/// COLOUR FUNCTIONS //

export const rgbify = (color) => {
  if (color.substring(0, 3).toLowerCase() === "hsl" ) {
    return HSLtoRGB(color)
  }

  if (color[0] === "#") {
    color = color.slice(1)
  }

  if (color.length === 3) {
    color = color[0]+color[0]+color[1]+color[1]+color[2]+color[2]
  }

  const hex = parseInt(color, 16)

  return [
    hex >> 16           // red
  ,(hex >>  8) & 0x00FF // green
  , hex        & 0xFF   // blue
  ]
}



export const tweenColor = (color1, color2, ratio) => {
  const rgb1 = rgbify(color1)
  const rgb2 = rgbify(color2)

  const hex = rgb1.map((value, index) => {
    value = Math.round(value - (value - rgb2[index]) * ratio)
    value = Math.max(0, Math.min(value, 255))

    return ((value < 16) ? "0" : "") + value.toString(16)
  })

  return "#" + hex.join("")
}



export const toneColor = (color, ratio) => {
  const prefix = color[0] === "#"

  if (prefix) {
    color = color.slice(1)
  }

  const rgb = rgbify(color)
             .map( value => {
    value = Math.floor(Math.max(0, Math.min(255, value * ratio)))
    return ((value < 16) ? "0" : "") + value.toString(16)
  })

  return (prefix ? "#" : "") + rgb.join("")
}



export const translucify = (color, opacity) => {
  if (color[0] === "#") {
    color = color.slice(1)
  }

  const rgb = rgbify(color)

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`
}


// https://stackoverflow.com/a/20129594/1927589
// https://qph.fs.quoracdn.net/main-qimg-aaa9a544d797f1109b29c55814319195.webp
export const getColor = ({ number, s=0.5, l=0.33, format="hsl" }) => {
  const h = number * 137.50776405 // ≈ golden angle: 180*(3-√5)

  s = Math.max(0, Math.min(s, 1))
  l = Math.max(0, Math.min(l, 1))

  switch (format.toLowerCase()) {
    case "rgb":
      return hsl2rgb(h, s, l)

    case "hex":
      return hsl2hex(h, s * 100, l * 100)

    default: // "hsl"
      return `hsl(${h},${s*100}%,${l*100}%)`;
  }
}


// https://stackoverflow.com/a/54014428/1927589
// input: h in [0,360] and s,v in [0,1] - output: r,g,b in [0,1]
export const hsl2rgb = (h,s,l) => {
  let a=s*Math.min(l,1-l);
  let f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);
  return [f(0),f(8),f(4)]
}


// https://stackoverflow.com/a/44134328/1927589
export const hsl2hex = (h, s, l) => {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}



export const HSLtoRGB = (colorString )=> {
  // "hsl(412.523,50%,40%)" <<< percentages
  // "412.523, 0.5, 0.4"    <<< ratios
  let rgb = [0, 0, 0]

  const regex = /(hsl\s*\(\s*)?([0-9.]+)\s*,\s*([0-9.]+)(%?)\s*,\s*([0-9.]+)(%?)\s*\)?/
  const match = regex.exec(colorString)

  if (match) {
    let h = parseFloat(match[2], 10)
    let s = parseFloat(match[3], 10)
    let l = parseFloat(match[5], 10)

    while (h > 360) {
      h -= 360
    }
    while (h < 0) {
      h += 360
    }
    if (match[4]) {
      s /= 100
    }
    s = Math.max(0, Math.min(s, 1))
    if (match[6]) {
      l /= 100
    }
    l = Math.max(0, Math.min(l, 1))

    rgb = hsl2rgb(h, s, l) // [<0.0-1.0>, <0.0-1.0>, <0.0-1.0>]
         .map(number => Math.round(number * 255))
  }

  return rgb
}


/**
 * @param   {<type>}  color   Must be a color (rgb or hex)
 * @param   {object}  values  May be an object with the same
 *                            structure as defaults
 * @return  {object}  Returns an object with the same structure as
 *                    defaults, but where each value is a color
 */
export const buttonColors = (color, values) => {
  const output = {
    restBg:     1
  , restTint:   1.5
  , restShade:  0.75

  , overBg:    1.1
  , overTint:  1.65
  , overShade: 0.667

  , downBg:    0.95
  , downTint:  1.333
  , downShade: 0.6
  }
  const keys = Object.keys(output)

  ;(function merge(input) {
    if (typeof input === "object") {
      keys.forEach( key => {
        const value = input[key]
        if (!isNaN(value)) {
          if (value > 0) {
            output[key] = value
          }
        }
      })
    }
  })()

  keys.forEach( key => (
    output[key] = toneColor(color, output[key])
  ))

  return output
}


/// ARRAY FUNCTIONS ///

export const removeFrom = (array, item, removeAll) => {
  let removed = 0
  let index
    , found

  do {
    if (typeof item === "function") {
      index = array.findIndex(item)
    } else {
      index = array.indexOf(item)
    }

    found = !(index < 0)
    if (found) {
      array.splice(index, 1)
      removed += 1
    }
  } while (removeAll && found)

  return removed
}



export const getDifferences = () => {
  let  previous = []

  return (array) => {
    const plus = array.filter(item => previous.indexOf(item) < 0)
    const minus = previous.filter(item => array.indexOf(item) < 0)
    previous = [...array]

    return { plus, minus }
  }
}



export const trackChanges = (array) => {
  const current = array
  let  previous = [...array]

  return () => {
    const plus = array.filter(item => previous.indexOf(item) < 0)
    const minus = previous.filter(item => array.indexOf(item) < 0)
    previous = [...array]

    return { plus, minus }
  }
}



export const shuffle = (a) => {
  let ii = a.length

  while (ii) {
    const jj = Math.floor(Math.random() * ii)
    ii -= 1;
    [a[ii], a[jj]] = [a[jj], a[ii]]
  }

  return a // for chaining
}



export const getRandom = (max, min = 0) => {
  return Math.floor(Math.random() * (max - min)) + min
}



export const getRandomFromArray = (array) => {
  return array[Math.floor(Math.random() * array.length)]
}



export const getUnused = (source, used, tolerateDuplicates) => {
  const unused = source.slice(0)
  used.forEach(item => removeFrom(unused, item))
  let item = getRandomFromArray(unused)

  if (!item && tolerateDuplicates) {
    // May return the same item multiple times,
    // rather than creating a smooth spread
    item = getRandomFromArray(source)
  }

  return item
}



/// MOUSE/TOUCH EVENT FUNCTIONS ///

export const getPageXY = (event) => {
  if (event.targetTouches && event.targetTouches.length) {
    event = event.targetTouches[0] || {}
  }

  return { x: event.pageX, y: event.pageY }
}


export const getXY = (event, frame) => {
  if (["client", "page", "offset"].indexOf(frame) < 0) {
    frame = "client"
  }
  if (event.targetTouches && event.targetTouches.length) {
    event = event.targetTouches[0] || {}
  }

  return { x: event[frame + "X"], y: event[frame + "Y"] }
}



/**
 * Returns a promise which will be:
 * * resolved if the mouse or touch moves more than triggerDelta
 *   pixels in any direction
 * * rejected if the mouse is released/touch gesture ends before
 *   moving that far
 *
 * @param  {event}  event should be a mousedown or touchstart event
 * @param  {number} triggerDelta should be a positive number of pixels
 *
 * @return  {promise}
 */
export const detectMovement = (event, triggerDelta) => {
  const trigger2 = triggerDelta * triggerDelta

  function movementDetected(resolve, reject) {
    const { x: startX, y: startY } = getPageXY(event)
    const options = { event, drag, drop }
    const cancel = setTrackedEvents(options)
    // { actions: { move: <"touchmove" | "mousemove">
    //              end:  <"toucheend" | "mouseup">
    // , drag: function
    // , drop: function
    // }

    // Check if the mouse/touch has moved more than triggerDelta
    // pixels in any direction, and resolve promise if so.
    function drag(event) {
      const { x, y } = getPageXY(event)
      const deltaX = startX - x
      const deltaY = startY - y
      const delta2 = (deltaX * deltaX + deltaY * deltaY)

      if (delta2 > trigger2) {
        setTrackedEvents(cancel)
        resolve()
      }
    }

    // Reject promise if the mouse is release before the mouse/touch
    // moved triggerDelta pixels in any direction.
    function drop(event) {
      setTrackedEvents(cancel)
      reject()
    }
  }

  return new Promise(movementDetected)
}



export const setTrackedEvents = ({ actions, event, drag, drop }) => {
  // Omit event to cancel tracking
  const body = document.body

  if (event) {
    if (typeof actions !== "object") {
      actions = {}
    }

    if (event.type === "touchstart") {
      actions.move  = "touchmove"
      actions.end   = "touchend"
    } else {
      actions.move  = "mousemove"
      actions.end   = "mouseup"
    }

    body.addEventListener(actions.move, drag, false)
    body.addEventListener(actions.end, drop, false)

  } else {
    body.removeEventListener(actions.move, drag, false)
    body.removeEventListener(actions.end, drop, false)
  }

  return { actions, drag, drop }
}


/// RECT & OBJECT FUNCTIONS ///

export const intersect = (rect1, rect2) => {
  return rect1.x < rect2.right
      && rect2.x < rect1.right
      && rect1.y < rect2.bottom
      && rect2.y < rect1.bottom
}



export const intersection = (rect1, rect2) => {
  const left   = Math.max( rect1.left || rect1.x || 0
                         , rect2.left || rect2.x || 0
                         )
  const right  = Math.min( rect1.right||rect1.left+rect1.width||0
                         , rect2.right||rect2.left+rect2.width||0
                         )
  if (!(left < right)) {
    return 0
  }

  const top    = Math.max( rect1.top || rect1.y || 0
                         , rect2.top || rect2.y || 0
                         )
  const bottom = Math.min( rect1.bottom||rect1.top+rect1.height||0
                         , rect2.bottom||rect2.top+rect2.height||0
                         )
  if (!(top < bottom)) {
    return 0
  }

  const x = left
  const y = top
  const width  = right - x
  const height = bottom - y

  return { x, y, left, right, top, bottom, width, height }
}



export const union = (rects) => {
  const [ rect, ...rest ] = rects
  let { left, right, top, bottom } = rect

  rest.forEach( rect => {
    left   = Math.min(left,   rect.left)
    right  = Math.max(right,  rect.right)
    top    = Math.min(top,    rect.top)
    bottom = Math.max(bottom, rect.bottom)
  })

  const x = left
  const y = top
  const width = right - left
  const height = bottom - top

  return { x, y, left, right, top, bottom, width, height }
}



export const pointWithin = ( x, y, rect ) => {
  return rect.x <= x
      && rect.y <= y
      && rect.right > x
      && rect.bottom > y
}


/**
 * Calculates which fraction of rect shares it area with container
 */
export const overlap = (rect, container) => {
  let overlap = intersection(rect, container) // 0 or rect object

  if (overlap) {
    const width  = rect.width || (rect.left - rect.right)
    const height = rect.height || (rect.bottom - rect.top)
    overlap = (overlap.width * overlap.height) / (width * height)
  }

  return overlap
}



export const valuesMatch = (a, b) => {
  if ( !a || typeof a !== "object" || !b || typeof b !== "object") {
    return false
  }

  const propsA = Object.getOwnPropertyNames(a)
  const propsB = Object.getOwnPropertyNames(b)

  if (propsA.length !== propsA.length) {
    return false
  }

  const total = propsA.length
  for ( let ii = 0; ii < total; ii += 1 ) {
    const prop = propsA[ii]

    if (a[prop] !== b[prop]) {
      return false
    }

    if (!removeFrom(propsB, prop)) {
      // prop is undefined in a and missing in b
      return false
    }
  }

  return true
}


// FONTS //

export const getFontFamily = (ff) => {
  const start = ff.indexOf('family=')
  if (start === -1) return 'sans-serif'
  let end = ff.indexOf('&', start)
  if(end === -1) end = undefined
  ff = ff.slice(start + 7, end).replace("+", " ")
  ff = '"'+ ff + '"'
  return ff // + ', sans-serif'
}


// ENCRYPTION

// by bryc https://stackoverflow.com/a/52171480/1927589
export const hash = function(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i)
        h1 = Math.imul(h1 ^ ch, 2654435761)
        h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ h1>>>16, 2246822507)
       ^ Math.imul(h2 ^ h2>>>13, 3266489909)
    h2 = Math.imul(h2 ^ h2>>>16, 2246822507)
       ^ Math.imul(h1 ^ h1>>>13, 3266489909)

    return 4294967296 * (2097151 & h2) + (h1>>>0)
}


// IMAGES //

// Inspired by https://ourcodeworld.com/articles/read/683/how-to-remove-the-transparent-pixels-that-surrounds-a-canvas-in-javascript
// MIT http://rem.mit-license.org
export const trimImage = (image) => {
  const c = document.createElement("canvas")
  c.width = image.width
  c.height = image.height

  const ctx = c.getContext('2d')
  ctx.drawImage(image, 0, 0)

  const copy = document.createElement('canvas').getContext('2d')
  const pixels = ctx.getImageData(0, 0, c.width, c.height)
  const l = pixels.data.length
  const bound = {
    top: null
  , left: null
  , right: null
  , bottom: null
  }
  let ii
    , x
    , y

  // Iterate over every pixel to find the highest
  // and where it ends on every axis ()
  for (ii = 0; ii < l; ii += 4) {
      if (pixels.data[ii + 3] !== 0) {
          x = (ii / 4) % c.width
          y = ~~((ii / 4) / c.width)

          if (bound.top === null) {
              bound.top = y
          }

          if (bound.left === null) {
              bound.left = x
          } else if (x < bound.left) {
              bound.left = x
          }

          if (bound.right === null) {
              bound.right = x
          } else if (bound.right < x) {
              bound.right = x
          }

          if (bound.bottom === null) {
              bound.bottom = y
          } else if (bound.bottom < y) {
              bound.bottom = y
          }
      }
  }

  // Calculate the height and width of the content
  const trimHeight = bound.bottom - bound.top
  const trimWidth = bound.right - bound.left
  const trimmed = ctx.getImageData(
    bound.left
  , bound.top
  , trimWidth
  , trimHeight
  )

  console.log(bound)

  copy.canvas.width = trimWidth
  copy.canvas.height = trimHeight
  copy.putImageData(trimmed, 0, 0)

  // Return an image
  const trimmedImage = new Image()
  trimmedImage.src =copy.canvas.toDataURL()

  return trimmedImage
}
// 
// window.trimImage = trimImage



// STRINGS //

export const localize = (cue, code, corpus, options) => {
  let phrase

  const phraseData = corpus.find(phrase => (
    phrase.cue === cue
  ))

  if (phraseData) {
    phrase = phraseData[code]

    if (!phrase) {
      // Check if there is a more generic phrase without the region
      code = code.replace(/-\w+/, "") // en | ru
      phrase = phraseData[code]
    }
  }

  if (!phrase) {
    console.log( "Not found — cue:", cue
               , "code:", code
               , "phraseData:", phraseData
               )
    phrase = "***" + cue + "***"
  }

  if (options) {
    if (typeof phrase === "object") {
      phrase = phrase.replace
    }

    for (key in options) {
      phrase = phrase.replace(key, options[key])
    }

  } else if (typeof phrase === "object") {
    phrase = phrase.simple
  }

  return phrase
}


// HTML ELEMENTS //


export const getElementIndex = (element, parentTag) => {
  let index = -1

  if (element instanceof HTMLElement) {
    parentTag = typeof parentTag === "string"
              ? parentTag.toUpperCase()
              : "UL"

    while (element && element.parentNode.tagName !== parentTag) {
      element = element.parentNode
    }

    if (element) {
      const siblings = [].slice.call(element.parentNode.children)
      index = siblings.indexOf(element)
    }
  }

  return index
}
