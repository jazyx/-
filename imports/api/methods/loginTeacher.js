/**
 * /import/api/methods/login.js
 */

import { Teachers } from '../../api/collections'



export default class LogInTeacher {
  constructor(accountData) {
    // console.log("LogInTeacher accountData:", accountData)

    const { id, d_code } = accountData

    const query = { id }
    const push = { $push: { loggedIn: d_code } }
    const result = Teachers.update(query, push) // 1 = success; 0 = not

    accountData.loggedIn = result
  }
}