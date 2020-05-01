/**
 * /import/api/methods/login.js
 */

import { Groups } from '../../api/collections'



export default class ToggleActivation {
  constructor(groupData) {
    // console.log("ToggleActivation groupData:", groupData)

    const { _id, d_code, active } = groupData
    const action = active
                 ? "$push"
                 : "$pull"

    const select = { _id }
    const update = {
      $set: {
        active
      }
    , [action]: {
        loggedIn: d_code
      }
    }
    const result = Groups.update(select, update)
    // 1 = success; 0 = not

    console.log( "ToggleActivation:", result
               , "db.groups.update("
               + JSON.stringify(select)
               + ", "
               + JSON.stringify(update)
               + ")"
               )


  }
}