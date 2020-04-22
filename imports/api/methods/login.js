/**
 * /import/api/methods/login.js
 */

import { Users
       , Teachers
       , Groups
       } from '../../api/collections'



export default class LogIn {
  constructor(accountData) {
    this.accountData = accountData
    // console.log(accountData)  
    // { username: "Влад"
    // , native:   "ru"
    // , teacher:  "jn"
    // , language: "en-GB"
    // , d_code:   "d9Uvl"
    //[, queried:  <true if call came from the getPIN view>] 
    // , q_code:   "0381"
    // , q_color:  "#33cc60"
    // , q_index:  1
    // , user_id:  "BqKkMjjBSRzedasyT"
    // , group_id: "PWwknSiHCGmsivSXg"
    // }

    if (!accountData.q_code) {
      // This might be:
      // [ ] A new user on a new device
      // [ ] A returning user on a new device
      // [ ] A returning user on a device with no localStorage
      // Check if any Users named `username` exist. If not, it's 
      // certainly a new user, and we can simply call CreateAccount.
      // If so, then we need to ask if the user has a PIN code (
      // returning user on device with no [prior] localStorage) or not
      // (new user)

      if (accountData.queried) {
        // An earlier call to log in was referred back to the Client
        // because the q_code was missing or did not match, and a
        // user with the given username already exists.
        accountData.action = "CreateAccount"

      } else {
        const nameExists = this.userWithThisNameExists()
        accountData.action = nameExists
                           ? "RequestPIN"
                           : "CreateAccount"
      }

    } else {
      // This might be:
      // [x] A new user for whom a q_code has just been created
      // [ ] A new user on a device with someone else's localStorage
      // [ ] A returning user on a device with so. else's localStorage
      // [ ] A returning user logging in manually
      // [ ] A returning user logging in automatically

      const existingUser = this.logInUserFromNameAndQCode()
      if (!existingUser) {
        accountData.action = "RequestPIN"

      } else {
        accountData.action = "loggedIn"
      }
    }
  }


  userWithThisNameExists() {
    const username = this.accountData.username
    const nameExists = !!Users.findOne({ username }, {})

    return nameExists
  }


  logInUserFromNameAndQCode() {
    const { username, q_code, d_code } = this.accountData

    const query = { username, q_code }
    const push = { $push: { loggedIn: d_code } }
    const result = Users.update(query, push) // 1 = success; 0 = not

    console.log("logInFromNameAndOCode", result)

    return result
  }
}