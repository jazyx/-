/**
 * /import/api/methods/logout.js
 */


import { Users
       , Teachers
       , Groups
       } from '../../api/collections'


export default class LogOut {
  constructor(logOutData) {
    const { id, d_code } = logOutData

    const update = {
      $pull: {
        logged_in: d_code
      }
    }

    let key
      , collection

    const isTeacher = (id.length < 5)

    if (isTeacher) {// "xxxx" => 456976 teacher id`s
      key = "id"
      collection = Teachers

    } else {
      key = "_id"
      collection = Users
    }

    const select = { [key]: id }

    const result = collection.update(select, update)

    // console.log( "result:", result
    //            , "<<< LogOut device db."
    //               + collection._name
    //               + ".update("
    //            + JSON.stringify(select)
    //            + ", "
    //            + JSON.stringify(update)
    //            + ")"
    //            )
  }
}