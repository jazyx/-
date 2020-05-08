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
    // destroyTracker.call({ _id: d_code, group_id })

    // Separate actions
    if (id.length < 5) {// "xxxx" => 456976 teacher id`s
      const teacherViews = this.getTeacherViewCount(id, group_id)
      if (!teacherViews) {
        this.deactivateGroup(group_id)
      }

    } else {
      this.userIsLeaving(id, group_id, dismissed)
    }
  }


  // Common actions
  removeDeviceFromGroup(group_id, d_code) {
    const select = { _id: group_id, logged_in: d_code }
    const pull   = { $pull: { logged_in: d_code }}
    const result = Groups.update(select, pull)

    // console.log( "result:", result
    //            , ", group_id", group_id
    //            , "db.groups.update("
    //              + JSON.stringify(select)
    //              + ", "
    //              + JSON.stringify(pull)
    //              + ")"
    //            )
  }


  getTeacherViewCount(id, group_id) {
     let select  = { id }
     const project = { fields: { logged_in: 1 } }
     const teacher = Teachers.findOne(select, project)
                  || { logged_in: [], fake: true }
     const d_codes = teacher.logged_in

     console.log( "teacher", teacher
                , "teacher's d_codes:", teacher.logged_in
                , "db.teachers.findOne("
                , JSON.stringify(select)
                , ", "
                , JSON.stringify(project)
                , ")"
                )

     select = { _id: group_id }
     const { logged_in } = Groups.findOne(select, project)

     console.log( "group's d_codes:", logged_in
                , "db.groups.findOne("
                , JSON.stringify(select)
                , ", "
                , JSON.stringify(project)
                , ")"
                )

     const t_codes = arrayOverlap(logged_in, d_codes)

     return t_codes.length  
  }


  // Teacher actions
  deactivateGroup(group_id) {
    const select = { _id: group_id }
    const set    = { $set: { active: false }}
    const result = Groups.update(select, set)

    // console.log( "deactivateGroup:", result
    //            , "db.groups.update("
    //            + JSON.stringify(select)
    //            + ", "
    //            + JSON.stringify(set)
    //            + ")")
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

    const result = Users.update(select, update)

    // console.log( "updateUserHistory:", result
    //            , "<<< db.users.update("
    //            + JSON.stringify(select)
    //            + ", "
    //            + JSON.stringify(update)
    //            + ")")
  }


  closeGroupIfDone(group_id) {
    const { logged_in
          , owner
          , active // should always be true
          } = this.getGroupMemberStatus(group_id)
    const ownerD_codes = this.getOwnerD_codes(owner, logged_in)
    const d_codeCount = ownerD_codes.length

    if (d_codeCount && d_codeCount === logged_in.length) {
      // The teacher is the only person left
      this.deactivateGroup(group_id)

    } else {
      this.promoteSlave(group_id, logged_in, ownerD_codes)
    }
  }


  getGroupMemberStatus(group_id) {
    const select  = { _id: group_id }
    const project = { fields: {
      logged_in: 1
    , owner: 1
    , active: 1
    }}
    const status  = Groups.findOne(select, project)

    // console.log( "status:", status
    //            , "db.groups.findOne("
    //            + JSON.stringify(select)
    //            + ", "
    //            + JSON.stringify(project)
    //            + ")")

    return status
  }


  getOwnerD_codes(owner, d_codes) {
    const select = { id: owner }
    const project = { fields: { logged_in: 1 }, }
    const { logged_in } = Teachers.findOne(select, project)

    // console.log( "getOwnerD_codes logged_in:", logged_in
    //            , "db.teachers.findOne("
    //            + JSON.stringify(select)
    //            + ", "
    //            + JSON.stringify(project)
    //            + ")")

    d_codes = arrayOverlap(d_codes, logged_in)

    return d_codes
  }


  // UNTESTED // UNTESTED // UNTESTED // UNTESTED // UNTESTED //

  promoteSlave(group_id, logged_in, ownerD_codes) {
    // Make sure the teacher is not master (= first in logged_in)
    let slave

    logged_in.every((d_code, index) => {
      if (ownerD_codes.includes(d_code)) {
        return true
      } else {
        slave = index && d_code // 0 if slave already at index 0
        return false
      }
    })

    if (slave) {
      const select = { _id: group_id }
      const pull = { $pull: { logged_in: slave }}
      const push = { $push: { logged_in: {$each:[slave],$position:0}}}
      let result = Groups.update(select, pull)

      // console.log( "pull slave:", result
      //            , "db.groups.findOne("
      //            + JSON.stringify(select)
      //            + ", "
      //            + JSON.stringify(pull)
      //            + ")")

      result = Groups.update(select, push)

      // console.log( "push slave:", result
      //            , "db.groups.findOne("
      //            + JSON.stringify(select)
      //            + ", "
      //            + JSON.stringify(push)
      //            + ")")
    }
  }
}