/**
 * /import/api/methods/logout.js
 */


import { Users
       , Teachers
       , Groups
       } from '../../api/collections'


export default class LogOut {
  constructor(logOutData) {
    const { id, d_code, group_id } = logOutData

    const update = {
      $pull: {
        loggedIn: d_code
      }
    }

    let key
      , collection

    if (id.length < 5) {// "xxxx" => 456976 teacher id`s
      key = "id"
      collection = Teachers

    } else {
      key = "_id"
      collection = Users
    }

    const select = { [key]: id }

    if (group_id) {
      // Also update entry in history
      const path = "history." + group_id
      const pathOut = path + ".$.out"
      select[path+".in"] = { $exists: true }
      select[pathOut]    = { $exists: false }

      update.$currentDate = {
        [pathOut]: true
      }
    }

    // console.log("db.users.update("
    //            + JSON.stringify(select)
    //            + ", "
    //            + JSON.stringify(update)
    //            + ")")

    const result = collection.update(select, update)
    // 0 if no in without out
    // 1 if history entry updated


    // console.log("result:", result, "<<< LogOut device", d_code, "from group", group_id )
  }
}