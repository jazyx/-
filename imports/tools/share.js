/**
 * imports/tools/share.js
 */


import collections from '../api/collections'
import { ReactiveVar } from 'meteor/reactive-var'
import { share } from '../api/methods'

const Groups = collections.Groups

let refresh = new ReactiveVar()
let instances = 0


class Share {
  constructor() {
    console.log("Share instance n°", ++instances)
    this.isMaster = false
    this.data = {}

    this.setAspectRatio = this.setAspectRatio.bind(this)
  }


  setAsMaster(group_id) {
    this.group_id = group_id
    this.isMaster = true
    this.setAspectRatio()
    window.addEventListener("resize", this.setAspectRatio, false)
  }


  joinAsSlave(_id) {
    this.group_id = _id
    this.isMaster = false
    window.addEventListener("resize", this.setAspectRatio, false)
    this.group = Groups.findOne({ _id })

    console.log(this.group.aspectRatio)
  }


  setAspectRatio(event) {
    const { width, height } = document.body.getBoundingClientRect()
    const data = { width, height }
    share.call({
      _id: this.group_id
    , key: "aspectRatio"
    , data
    })
  }


  get() {
    refresh.get()
    return this.data
  }
}



export default new Share()