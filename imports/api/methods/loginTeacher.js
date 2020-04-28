/**
 * /import/api/methods/login.js
 */

import { Teachers } from '../../api/collections'



export default class LogInTeacher {
  constructor(accountData) {
    // console.log("LogInTeacher accountData:", accountData)

    const { id, d_code } = accountData

    const select = { id }
    const update = {
      $push: {
        loggedIn: d_code
      }
    }
    const result = Teachers.update(select, update) // 1 = success; 0 = not

    accountData.loggedIn = result
  }
}