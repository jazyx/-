/**
 * /import/api/methods/login.js
 */

import { Groups } from '../../api/collections'



export default class ToggleActivation {
  constructor(groupData) {
    console.log("ToggleActivation groupData:", groupData)

    const { _id, active } = groupData

    const select = { _id }
    const update = {
      $set: {
        active
      }
    }
    const result = Groups.update(select, update) // 1 = success; 0 = not

    groupData.loggedIn = result
  }
}