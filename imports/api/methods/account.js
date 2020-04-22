/**
 * /import/api/methods/account.js
 */

import { Users
       , Teachers
       , Groups
       } from '../../api/collections'

import { GOLDEN_ANGLE
       , RATIO 
       } from '../magicNumbers'
import { hsl2hex } from '../../tools/utilities'



export default class CreateAccount {
  constructor(accountData) {
    this.accountData = accountData

    //console.log("CreateAccount accountData:", accountData)
    // 
    // d_code:   "LZ5lf"
    // language: "en-GB"
    // native:   "ru"
    // teacher:  "jn"
    // username: "Влад"
  
    /// <<< HARD-CODED
    this.saturation = 60
    this.luminosity = 50
    /// HARD-CODED >>>  

    this.createUniqueQCode()
    this.createUser()
    this.createGroupWithTeacher()

    // console.log("create accountData:", accountData)
    //
    // = username: "Влад"
    // = teacher:  "jn"
    // = d_code:   "d9Uvl"
    // + q_code:   "0381"
    // + user_id:  "BqKkMjjBSRzedasyT"
    // + group_id: "PWwknSiHCGmsivSXg"
    //
    // // Not needed in the return value
    // = language: "en-GB"
    // = native:   "ru"
    // + q_color:  "#33cc60"
    // + q_index:  1
    // + loggedIn: []

    const notNeeded = [
      "language"
    , "native"
    , "q_color"
    , "q_index"
    , "loggedIn"
    ]

    notNeeded.forEach(key => {delete accountData[key]})
  }


  createUniqueQCode() {
    // Create or recyle a number between 0001 and 9999

    let q_index = Users.find().count() + 1
    let hue
      , q_code
      , q_color

    if (q_index < 6765) {
      // Use the Golden Angle to get the next value

      hue  = this.getAngleFrom(q_index)
      q_code = this.getQCodeFrom(hue)

    } else if (q_index < 8901) {
      // TODO: Use the Golden Angle, but check for duplicate q_code's

    } else if (q_index < 10000) {
      // TODO: Find a gap in the index numbers

    } else {
      // TODO: We can't have more than 9999 unique q_codes. Find the
      // User with a name different from this.accountData.username
      // who logged in last the longest time ago, archive that User
      // record and reuse that User's q_index and q_code. The q_color
      // will be reset below.
    }

    q_color = hsl2hex(hue, this.saturation, this.luminosity)

    this.accountData.q_index = q_index
    this.accountData.q_code  = q_code
    this.accountData.q_color = q_color
  }


  getAngleFrom(index) {
    let angle = index * GOLDEN_ANGLE
    angle -= Math.floor(angle / 360) * 360 // 0.0 ≤ angle < 360.0

    return angle
  }


  getQCodeFrom(angle) {
    let code = Math.floor(angle * RATIO)

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


  createUser() {
    // Remove d_code before inserting new User document...
    const { d_code } = this.accountData
    delete this.accountData.d_code

    this.accountData.loggedIn = []

    // console.log("createUser", this.accountData)
    // language: "en-GB"
    // loggedIn: []
    // native: "ru"
    // q_code: "0381"
    // q_color: "#33cc60"
    // q_index: 1
    // teacher: "jn"
    // username: "Влад"

    this.accountData.user_id = Users.insert(this.accountData)

    // ... and restore d_code afterwards to be used for logIn
    this.accountData.d_code = d_code
  }


  createGroupWithTeacher() {
    const group = {
      user_ids: [ 
        this.accountData.user_id
      , this.accountData.teacher
      ]
    , teacher_id: this.accountData.teacher
    , loggedIn: []
    , view: "Activity" // by default
    // // Will be added by the Client
    // , viewData: {}
    // , viewSize: { width, height }
    }
    this.accountData.group_id = Groups.insert(group)
  }


  create() {
    this.createUniqueQCode()
    this.createUser()
    this.createGroupWithTeacher()

    // console.log("create accountDatat:", this.accountData)
    //
    // = teacher:  "jn"
    // = d_code:   "d9Uvl"
    // + q_code:   "0381"
    // + q_color:  "#33cc60"
    // + q_index:  1
    // + user_id:  "BqKkMjjBSRzedasyT"
    // + group_id: "PWwknSiHCGmsivSXg"
    //
    // // Not needed in the return value
    // = username: "Влад"
    // = language: "en-GB"
    // = native:   "ru"
    // + loggedIn: []

    const notNeeded = [
      "username"
    , "language"
    , "native"
    , "loggedIn"
    ]
    notNeeded.forEach(key => {delete this.accountData[key]})

    return this.accountData
  } 
}