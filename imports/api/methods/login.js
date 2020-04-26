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

    const nameExists = this.userWithThisNameExists()

    if (!nameExists) {
      // This might be:
      // [ ] A new user

      accountData.status = "CreateAccount"

    } else if ( accountData.status === "CreateAccount"
            && !accountData.accountCreated
              ) {
      // This might be:
      // [ ] A new user with a common name
      // An earlier call to log in was referred back to the Client
      // because a user with the given username already exists and the
      // q_code was missing or did not match, and the user pressed
      // the Create New Account button

      return // There's nothing to do here yet, but we'll be back
             // with accountCreated set to true

    } else if (!accountData.q_code) {
      // This might be:
      // [ ] A new user with a common name
      // [ ] A returning user
      // [ ] ... on a new device
      // [ ] --- or on a device with someone else's localStorage
      // We need to ask if the user has a PIN code (returning user on
      // device with no [prior] localStorage) or not (new user)

      accountData.status = "RequestPIN"

    } else {
      // This might be:
      // [x] A new user for whom a q_code has just been created
      // [ ] A returning user on a device with so. else's localStorage
      // [ ] A returning user logging in manually
      // [ ] A returning user logging in automatically

      const existingUser = this.logInUserFromNameAndQCode()
      if (!existingUser) {
        accountData.status = "RequestPIN"

      } else {
        accountData.status = "loggedIn"
        accountData.loggedIn = true
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

    if (result) {
      this.accountData.user_id = Users.findOne(query, {})._id
    }

    return result
  }
}