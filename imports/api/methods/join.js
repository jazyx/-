/**
 * /import/api/methods/join.js
 */

import { Users
       , Groups
       , getNextIndex
       } from '../../api/collections'



export default class JoinGroup {
  constructor(accountData) {
    // console.log("JoinGroup", accountData
    // Minimum:
    // {
    //   d_code: "dm4eN"
    //   group_id: "97NS2hDEYntEhXXbr"
    //   user_id: "YZ2xJoHf5SDzZPQED"
    // }


    const { group_id, d_code, user_id } = accountData
    let success = this.joinGroup(group_id, d_code)

    if (success) {
      accountData.view = this.getAccountView(group_id)
      success = this.addUserHistoryItem(group_id, d_code, user_id)

      if (success) {
        accountData.status = "JoinGroup_success"
      } else {
        accountData.status = "JoinGroup_noHistoryItem"
      }

    } else {
      accountData.status = "JoinGroup_fail"
    }
  }


  joinGroup( group_id, d_code) {
    const query = { _id: group_id }
    const push = { $push: { loggedIn: d_code }}
    const success = Groups.update(query, push)

    return success
  }


  getAccountView(group_id) {
    const query = { _id: group_id }
    const project = { fields: { _id: 0, view: 1 }}
    const view = Groups.findOne(query, project).view

    return view
  }


  addUserHistoryItem(group_id, d_code, user_id) {
    const index = getNextIndex("history") // could use a random value
    const query = { _id: user_id }
    const item  = { d_code: d_code, in: index }
    const path  = "history." + group_id
    // { ...
    // , history: {
    //     <group_id>: [ ...
    //     , { d_code: "xxxxx"
    //       , in:  ISO_loggedInTime
    //       , out: ISO_loggedOutTime
    //       , status: { TBD }
    //       }
    //     ]
    //   }
    // , ...
    // }
    const push = {
      $push: {
        [path]: item
      }
    }

    let success = Users.update(query, push)

    if (success) {
      query[path + ".in"] = index
      const created = {
        $currentDate: { [path + ".$.in"]: true }
      }

      console.log( "db.users.update("
                 + JSON.stringify(query)
                 + ", "
                 + JSON.stringify(created)
                 + ")"
                 )

      success = Users.update(
        query
      , created
      )
    }

    return success
  }
}