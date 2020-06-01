/**
 * /import/api/methods/join.js
 */

import { Users
       , Groups
       , getNextIndex
       } from '../../api/collections'



export default class JoinGroup {
  constructor(accountData) {
    // console.log("JoinGroup", accountData)
    //
    // { user_id: "YZ2xJoHf5SDzZPQED"
    // , d_code: "dm4eN"
    //
    // // Manual log in will use teacher to find group_id, or will
    // // create a new group using user_id, teacher and language
    // // (group_id will be overridden, because it might refer to
    // //  the last group the user joined, rather than the group with
    // //  this teacher)
    // , teacher:  "aa"
    // , language: "ru"
    //
    // // auto_login will not have teacher or language, so requires
    // // group_id
    // , group_id: "97NS2hDEYntEhXXbr"
    // }

    let {user_id, d_code, teacher, language, group_id } = accountData
    if (teacher && language) {
      group_id = this.groupWithThisTeacher(user_id, teacher)
    }

    if (group_id) {
      // The user might have chosen a different group from last time
      accountData.group_id = group_id
    } else {
      return accountData.status = "CreateGroup"
      // We'll be back
    }

    // if (!group_id) {
    //   group_id = accountData.group_id = this.findLatestGroup(user_id)

    //   if (!group_id) {
    //     group_id = accountData.group_id = this.findAnyGroup(user_id)
    //   }
    // }

    let success = this.joinGroup(group_id, d_code)

    if (success) {
      accountData.path = accountData.restore_all
                       ? this.getPath(group_id, d_code)
                       : [] /// <<< HARD-CODED
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


  groupWithThisTeacher(user_id, teacher) {
    const select = {
      members: {
        $all: [
          user_id
        , teacher
        ]
      , $size: 2
      }
    }

    const { _id } = (Groups.findOne(select) || {})

    return _id
  }


  // findLatestGroup(user_id) {
  //   let latestId

  //   const select  = { _id: user_id }
  //   const project = { fields: { history: 1 }}
  //   const history = (Users.findOne(select, project) || {}).history

  //   if (history) {
  //     // console.log("history:", history)
  //     // { <group_id>: [
  //     //     {  in: ISODate...
  //     //     , out: ISODate...
  //     //     }
  //     //   , ...
  //     //   ]
  //     // , ...
  //     // }

  //     let latestDate = 0

  //     const group_ids = Object.keys(history)
  //     group_ids.forEach(group_id => {
  //       const array = history[group_id]
  //       array.forEach(item => {
  //         const date = new Date( item.out
  //                              ? item.out
  //                              : item.in || 0
  //                              )
  //         if (latestDate < date) {
  //           latestDate = date
  //           latestId = group_id
  //         }
  //       })
  //     })
  //   }

  //   return latestId // will be undefined if there is no history
  // }


  // findAnyGroup(user_id) {
  //   const select  = { members: user_id }
  //   const project = {}
  //   const group_id = (Groups.findOne(select, project) || {})._id

  //   // console.log( "group_id:", group_id
  //   //            , "<<< db.groups.findOne("
  //   //            + JSON.stringify(select)
  //   //            + ", "
  //   //            + JSON.stringify(project)
  //   //            + ")"
  //   //            )

  //   return group_id // will be undefined if there is no history
  // }


  joinGroup( group_id, d_code) {
    const select = { _id: group_id }
    const push = { $push: { logged_in: d_code }}
    const success = Groups.update(select, push)

    return success
  }


  getPath(group_id, d_code) {
    const select = { _id: group_id }
    const project = { fields: { path: 1 }}
    const { path } = Groups.findOne(select, project)

    return path
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