/**
 * imports/tools/share.js
 */

let instances = 0

class Share {
  constructor() {
    console.log("Share instance n°", ++instances)
    this.isMaster = false

    this.setAspectRatio = this.setAspectRatio.bind(this)
  }

  setAsMaster(group_id) {
    this.group_id = group_id
    this.isMaster = true
    this.setAspectRatio()
    window.addEventListener("resize", this.setAspectRatio, false)
  }

  joinAsSlave(group_id) {
    this.group_id = group_id
    this.isMaster = false
    window.addEventListener("resize", this.setAspectRatio, false)

  }

  setAspectRatio(event) {}
}



export default new Share()