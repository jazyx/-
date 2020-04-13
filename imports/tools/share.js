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
    this.viewData = {}
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
    }

    this.setViewRatio(width, height)
  }


  setViewRatio(width, height) {
    this.group    = Groups.findOne({ _id: this.group_id })
    const viewSize = this.group.viewSize
    const ratioH = height / viewSize.height
    const ratioW = width / viewSize.width
    let uh
      , uv

    if (ratioH > ratioW) {
      // Show view as wide as possible but reduce height
      uv = width / 100
      uh = height * ratioW / 100

    } else {
      // Show view as tall as possible but reduce width
      uv = width * ratioH / 100
      uh = height / 100
    }

    this.viewData.units = {
      uv
    , uh
    , umin: Math.min(uv, uh)
    , umax: Math.max(uv, uh)
    , wide: uv > uh
    , width
    , height
    }

    this.refresh()
  }


  refresh() {
    refresh.set(refresh.get() + 1)
  }


  get() {
    refresh.get()
    return Object.assign({}, this.group, this.viewData)
  }
}



export default new Share()