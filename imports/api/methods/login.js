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
    // console.log("accountData before Login:", accountData)

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
      // [ ] A returning user logging in manually...
      // [ ] ... perhaps to start with a new teacher
      // [ ] A returning user logging in automatically

      const existingUser = this.logInUserFromNameAndQCode()
      if (!existingUser) {
        accountData.status = "RequestPIN"

      } else {
        // const teacherGroup = this.userHasTeacherGroup()

        // if (!teacherGroup) {
        //   accountData.status = "CreateGroup"

        // } else {
          accountData.status = "loggedIn"
        // }

        accountData.loggedIn = true
      }
    }
  }


  userWithThisNameExists() {
    const username = this.accountData.username
    const nameExists = Users.findOne({ username }, {})

    return !!nameExists
  }


  logInUserFromNameAndQCode() {
    const { username, q_code, d_code } = this.accountData

    const select = { username, q_code }
    const push = { $push: { logged_in: d_code } }
    const result = Users.update(select, push) // 1 = success; 0 = not

    if (result) {
      const project = { fields: { q_color: 1 } }
      const { _id: user_id, q_color } = Users.findOne(select, project)
      Object.assign( this.accountData, { user_id, q_color } )
    }

    return result
  }


  // userHasTeacherGroup() {
  //   const { user_id, teacher } = this.accountData
  //   const select = {
  //     members: {
  //       $all: [
  //         user_id
  //       , teacher
  //       ]
  //     , $size: 2
  //     }
  //   }

  //   const groupWithTeacherOnlyExists = Groups.findOne(select)

  //   return !!groupWithTeacherOnlyExists
  // }
}