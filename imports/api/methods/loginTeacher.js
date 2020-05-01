/**
 * /import/api/methods/loginTeacher.js
 *
 * A teacher is connecting at the beginning of a session, or returning
 * to the Teach view
 */

import { Teachers
       , Groups
       } from '../../api/collections'



export default class LogInTeacher {
  constructor(accountData) {
    // console.log("LogInTeacher accountData:", accountData)

    const { id, d_code } = accountData
    const left = this.leaveAllGroups(id, d_code)
    const loggedIn = this.setLoggedIn(id, d_code)

    accountData.loggedIn = loggedIn
  }


  setLoggedIn(id, d_code) {
    const select = { id }
    const addToSet = {
      $addToSet: {
        loggedIn: d_code
      }
    }
    const result = Teachers.update(select, addToSet) // 1 = success; 0 = not

    // console.log( "setLoggedIn:", result
    //            , "db.Teachers.update("
    //            + JSON.stringify(select)
    //            + ", "
    //            + JSON.stringify(addToSet)
    //            + ")"
    //            )

    return result
  }


  leaveAllGroups(id, d_code) {
    const select = { members: id, loggedIn: d_code }
    const pull = {
      $pull: {
        loggedIn: d_code
      }
    }
    const result = Groups.update(select, pull) // 1 = success; 0 = not

    // console.log( "leaveAllGroups:", result
    //            , "db.groups.update("
    //            + JSON.stringify(select)
    //            + ", "
    //            + JSON.stringify(pull)
    //            + ")"
    //            )

    return result
  }
}