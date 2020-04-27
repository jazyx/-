/**
 * /import/api/methods/logout.js
 */


import { Users
       , Teachers
       } from '../../api/collections'


export default class LogOut {
  constructor(logOutData) {
    const { id, d_code, group_id } = logOutData

    let key
      , collection

    if (id.length < 5) {// "xxxx" => 456976 teacher id`s
      key = "id"
      collection = Teachers
    } else {
      key = "_id"
      collection = Users
    }

    const query  = { [key]: id }
    const update = { $pull: { loggedIn: d_code }}

    if (group_id) {
      // Also remove entry from history
      const path = "history." + group_id
      const pathOut = path + ".$.out"
      query[path+".in"] = { $exists: true }
      query[pathOut]    = { $exists: false }

      update.$currentDate = {
        [pathOut]: true
      }
    }

    // console.log("db.users.update("
    //            + JSON.stringify(query)
    //            + ", "
    //            + JSON.stringify(update)
    //            + ")")

    const result = collection.update(query, update)
    // 0 if no in without out
    // 1 if history entry updated


    // console.log("result:", result, "<<< LogOut device", d_code, "from group", group_id )
  }
}