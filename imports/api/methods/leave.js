/**
 * /import/api/methods/leave.js
 */


import { Users
       , Teachers
       , Groups } from '../../api/collections'
import { destroyTracker } from '../../api/points'
import { arrayOverlap } from '../../tools/utilities'



export default class LeaveGroup {
  constructor(deviceData) {
    const { id, group_id, d_code, dismissed=false } = deviceData

    if (!group_id) {
      return
    }

    // Common actions for both Teachers and Users
    this.removeDeviceFromGroup(group_id, d_code)
    destroyTracker.call({ _id: d_code, group_id })

    // Separate actions
    if (id.length < 5) {// "xxxx" => 456976 teacher id`s
      /** When the teacher leaves, the group is dissolved
       *
       *  The group .active is set to false
       *  All the users are made to leave
       *  As a result, the Points records are destroyed
       */
      this.deactivateGroup(group_id)
      this.emptyTheGroup(group_id) // colls this class recursively

    } else {
      this.userIsLeaving(id, group_id, dismissed)
    }
  }


  // Common actions
  removeDeviceFromGroup(group_id, d_code) {
    const select = { _id: group_id, loggedIn: d_code }
    const pull   = { $pull: { loggedIn: d_code }}
    const result = Groups.update(select, pull)

    console.log( "result:", result
               , ", group_id", group_id
               , "db.groups.update("
                 + JSON.stringify(select)
                 + ", "
                 + JSON.stringify(pull)
                 + ")"
               )
  }


  // Teacher actions
  deactivateGroup(group_id) {
    const select = { _id: group_id }
    const set    = { $set: { active: false }}
    const result = Groups.update(select, set)

    console.log( "deactivateGroup:", result
               , "db.groups.update("
               + JSON.stringify(select)
               + ", "
               + JSON.stringify(set)
               + ")")
  }


  emptyTheGroup(group_id) {
    // Get the array of loggedIn devices...
    const select = { _id: group_id }
    const project = { loggedIn: 1, _id: 0 }
    const { loggedIn } = Groups.findOne(select, project)

    // ... and for each device, find its owner and tell them to go
    const tellUserToLeave = userData => {
      const id = userData._id
      const d_codes = arrayOverlap(loggedIn, userData.loggedIn)

      d_codes.forEach(d_code => {
        new LeaveGroup({ id, d_code, group_id, dismissed: true })
      })
    }

    const filter = { loggedIn: { $elemMatch: { $in: loggedIn }}}

    console.log( "db.groups.find("
               + JSON.stringify(filter)
               + ", "
               + JSON.stringify(project)
               + ")"
               )
    // db.groups.find({
    //     loggedIn: {
    //       $elemMatch: {
    //         $in: [
    //           "0kigTBd"
    //         , "PHD8Swq"
    //         ]
    //       }
    //     }
    //   }
    // , {
    //     loggedIn: 1
    //   , _id: 0
    //   }
    // )

    Groups.find(filter, project)
          .fetch()
          .forEach(tellUserToLeave)
  }


  // User actions
  userIsLeaving(_id, group_id, dismissed) {
    this.updateUserHistory(_id, group_id)

    if (!dismissed) {
      // The User is leaving of their own accord. If this is the last
      // user in the group, the Teacher should return to the Teach
      // view.
      this.closeGroupIfDone(group_id)
    }
  }


  updateUserHistory(_id, group_id) {
    const path = "history." + group_id
    const pathOut = path + ".$.out"
    const select = {
      _id
    , [path+".in"]: { $exists: true }
    , [pathOut]:    { $exists: false }
    }
    const update = {
      $currentDate: {
        [pathOut]: true
      }
    }

    console.log( "updateUserHistory:"
               , "db.users.update("
               + JSON.stringify(select)
               + ", "
               + JSON.stringify(update)
               + ")")

    Users.update(select, update)
  }


  closeGroupIfDone(group_id) {
    const { loggedIn
          , owner
          , active // should always be true
          } = this.getGroupMemberStatus(group_id)
    const ownerD_codes = this.getOwnerD_codes(owner, loggedIn)
    const d_codeCount = ownerD_codes.length

    if (d_codeCount && d_codeCount === loggedIn.length) {
      // The teacher is the only person left
      this.deactivateGroup(group_id)

    } else {
      this.promoteSlave(group_id, loggedIn, ownerD_codes)
    }
  }


  getGroupMemberStatus(group_id) {
    const select  = { _id: group_id }
    const project = { loggedIn: 1, owner: 1, active: 1, _id: 0 }
    const status  = Groups.findOne(select, project)

    console.log( "status:", status
               , "db.groups.findOne("
               + JSON.stringify(select)
               + ", "
               + JSON.stringify(project)
               + ")")

    return status
  }


  getOwnerD_codes(owner, d_codes) {
    const select = { id: owner }
    const project = { fields: { loggedIn: 1 }, }
    const { loggedIn } = Teachers.findOne(select, project)

    console.log( "getOwnerD_codes loggedIn:", loggedIn
               , "db.teachers.findOne("
               + JSON.stringify(select)
               + ", "
               + JSON.stringify(project)
               + ")")

    d_codes = arrayOverlap(d_codes, loggedIn)

    return d_codes
  }


  promoteSlave(group_id, loggedIn, ownerD_codes) {
    // Make sure the teacher is not master (= first in loggedIn)
    let slave

    loggedIn.every((d_code, index) => {
      if (ownerD_codes.includes(d_code)) {
        return true
      } else {
        slave = index && d_code // 0 if slave already at index 0
        return false
      }
    })

    if (slave) {
      const select = { _id: group_id }
      const pull = { $pull: { loggedIn: slave }}
      const push = { $push: { loggedIn: {$each:[slave],$position:0}}}
      let result = Groups.update(select, pull)

      console.log( "pull slave:", result
                 , "db.groups.findOne("
                 + JSON.stringify(select)
                 + ", "
                 + JSON.stringify(pull)
                 + ")")

      result = Groups.update(select, push)

      console.log( "push slave:", result
                 , "db.groups.findOne("
                 + JSON.stringify(select)
                 + ", "
                 + JSON.stringify(push)
                 + ")")
    }
  }
}