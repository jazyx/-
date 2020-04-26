/**
 * /import/api/methods/logout.js
 */


import { Users } from '../../api/collections'


export default class LogOut {
  constructor(logOutData) {
    const { id, d_code, group_id } = logOutData

    const path = "history." + group_id
    const pathOut = path + ".$.out"
    const query = {
      [path+".in"]: { $exists: true }
    , [pathOut]:    { $exists: false }
    }

    if (id.length < 5) {// "xxxx" => 456976 teacher id`s
      query.teacher_id = id
    } else {
      query._id = id
     }

    const outdate = {
      $currentDate: {
        [pathOut]: true
      }
    , $pull: { loggedIn: d_code }
    }

    // console.log("db.users.update("
    //            + JSON.stringify(query)
    //            + ", "
    //            + JSON.stringify(outdate)
    //            + ")")

    const result = Users.update(query, outdate)
    // 0 if no in without out
    // 1 if history entry updated

    // console.log("result:", result, "<<< LogOut device", d_code, "from group", group_id )
  }
}