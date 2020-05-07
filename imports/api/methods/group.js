/**
 * /import/api/methods/account.js
 */

import { Groups } from '../../api/collections'



export default class CreateGroup {
  constructor(accountData) {
    // Minimum:
    // { user_id: <>
    // , teacher: <>
    // , language: <>
    // }

    console.log("accountData before CreateGroup:", accountData)

    const view = "Activity" // <<< HARD-CODED default value

    const group = {
      owner:      accountData.teacher
    , language:   accountData.language
    , active:     false // becomes true if Teacher logs in personally
    , lobby:      ""
    , chat_room:  ""
    , members: [
        accountData.user_id
      , accountData.teacher
      ]
    , logged_in: []
    , view
    // // Will be added by the Client
    // , view_data: {}
    // , view_size: { width, height }
    }
    accountData.group_id = Groups.insert(group)
    accountData.groupCreated = true

    console.log("accountData after CreateGroup:", accountData)
  }
}