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


    let { group_id, d_code, user_id } = accountData
    if (!group_id) {
      group_id = accountData.group_id = this.findLatestGroup(user_id)
    }

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


  findLatestGroup(user_id) {
    let latestId

    const select  = { _id: user_id }
    const project = { fields: { history: 1 }}
    const history = (Users.findOne(select, project) || {}).history

    if (history) {
      // console.log("history:", history)
      // { <group_id>: [
      //     {  in: ISODate...
      //     , out: ISODate...
      //     }
      //   , ...
      //   ]
      // , ...
      // }

      let latestDate = 0

      const group_ids = Object.keys(history)
      group_ids.forEach(group_id => {
        const array = history[group_id]
        array.forEach(item => {
          const date = new Date( item.out
                               ? item.out
                               : item.in || 0
                               )
          if (latestDate < date) {
            latestDate = date
            latestId = group_id
          }
        })
      })
    }

    return latestId // will be undefined if there is no history
  }


  joinGroup( group_id, d_code) {
    const select = { _id: group_id }
    const push = { $push: { loggedIn: d_code }}
    const success = Groups.update(select, push)

    return success
  }


  getAccountView(group_id) {
    const select = { _id: group_id }
    const project = { fields: { _id: 0, view: 1 }}
    const view = Groups.findOne(select, project).view

    return view
  }


  addUserHistoryItem(group_id, d_code, user_id) {
    const index = getNextIndex("history") // could use a random value
    const select = { _id: user_id }
    const item  = { in: index }
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

    // Insert the { in: <...> } history item at index position 0, so
    // that a subsequent operation to add an out: <...> field to this
    // item will find it.

    const push = {
      $push: {
        [path]: {
          $each: [item]
        , $position: 0
        }
      }
    }

    let success = Users.update(select, push)

    if (success) {
      select[path + ".in"] = index
      const created = {
        $currentDate: { [path + ".$.in"]: true }
      }

      // console.log( "db.users.update("
      //            + JSON.stringify(select)
      //            + ", "
      //            + JSON.stringify(created)
      //            + ")"
      //            )

      success = Users.update(
        select
      , created
      )
    }

    return success
  }
}