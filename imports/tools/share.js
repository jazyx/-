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
    this.viewData = { ratio: 1 }
    this.isMaster = false
    this.setViewSize = this.setViewSize.bind(this)
  }


  joinGroup(_id, asMaster) {
    this.group_id = _id
    this.isMaster = asMaster
    this.group    = Groups.findOne({ _id })
    this.setViewSize()
    window.addEventListener("resize", this.setViewSize, false)
  }


  setView(data) {
    if (this.isMaster) {
      share.call({
        _id: this.group_id
      , key: "view"
      , data
      })
    }
  }


  setViewSize(event) {
    const { width, height } = document.body.getBoundingClientRect()
    const data = { width, height }

    if (this.isMaster) {
      share.call({
        _id: this.group_id
      , key: "viewSize"
      , data
      })
    } else {
      this.slaveSetViewRatio(width, height)
    }

    this.refresh() 
  }


  slaveSetViewRatio(width, height) {
    const viewSize = this.group.viewSize
    this.viewData.ratio = Math.min(
      width / viewSize.width
    , height / viewSize.height
    )
  }


  refresh() {
    refresh.set(refresh.get() + 1)
  }


  get() {
    refresh.get()
    return Object.assign(this.viewData, this.group)
  }
}



export default new Share()