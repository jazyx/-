/**
 * /import/api/methods/leave.js
 */


import { Groups } from '../../api/collections'


export default class LeaveGroup {
  constructor(deviceData) {
    const { group_id, d_code } = deviceData

    if (!group_id) {
      return
    }

    const query = { loggedIn: d_code, _id: group_id }
    const pull   = { $pull: { loggedIn: d_code }}
    const success = Groups.update(query, pull)

    // console.log( "success:", success
    //            , ", group_id", group_id
    //            , "db.groups.update("
    //              + JSON.stringify(query)
    //              + ", "
    //              + JSON.stringify(pull)
    //              + ")"
    //            )
  }
}