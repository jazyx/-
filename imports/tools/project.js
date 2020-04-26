/**
 * /imports/api/tools/project.js
 */

import { getRandomFromArray } from './utilities'


export const GOLDEN_ANGLE = 180 * (3 - Math.sqrt(5))
export const RATIO        = 14221/512 // stretches 360 to 9999.140


export const getGoldenAngleAt = (index) => {
  let angle = index * GOLDEN_ANGLE
  angle -= Math.floor(angle / 360) * 360 // 0.0 ≤ angle < 360.0

  return angle
}


export const getCodeFrom = (angle) => {
  let code = Math.round(angle * RATIO)

  // The following lines depend on 0 ≤  code ≤ 9999, because of the
  // values of RATIO. If RATIO is multiplied by 10, for example,
  // we'll need an extra zero and an extra } else if { statement.

  if (code < 10) {
    code = "000" + code
  } else if (code < 100) {
    code = "00" + code
  } else if (code < 1000) {
    code = "0" + code
  } else {
    code = "" + code
  }

  return code
}


export const getD_code= () => {
  let d_code    = ""
  const source = "0123456789&#"
               + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
               + "abcdefghijklmnopqrstuvwxyz"
  const length = source.length
  const total  = 7 // Creates 4 398 046 511 104 possible strings
  for ( let ii = 0; ii < total; ii += 1 ) {
    d_code += getRandomFromArray(source)
  }

  Session.set("d_code", d_code)

  return d_code
}