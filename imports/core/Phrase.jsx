/**
 * Phrases.jsx
 */

import { Meteor } from 'meteor/meteor'
import { Session } from 'meteor/session'
import { withTracker } from 'meteor/react-meteor-data'

import collections from '../api/collections'


class Phrases{
  constructor() {
    this.collection  = collections["L10n"]
    Meteor.subscribe(this.collection._name)

    this.phraseQuery = {
      $and: [
        { type: { $eq: "phrase" }}
      , { file: { $exists: false }}
      ]
    }
    this.flagsQuery  = { $and: [
                            { file: { $exists: true } }
                          , { file: { $ne: "xxxx"} }
                          ]
                        }
    this.folderQuery = { folder:  { $exists: true }}

    this.ready = false
    this.poll = this.poll.bind(this)
    this.poll()
  }


  poll() {
    this.folder  = this.collection.findOne(this.folderQuery)
    this.flags   = this.collection.find(this.flagsQuery).fetch()
    this.phrases = this.collection.find(this.phraseQuery).fetch()

    if (!this.folder) {
      setTimeout(this.poll, 100)
    } else {
      this.ready = true
      this.folder = this.folder.folder
    }
  }


  isReady() {
    return this.ready
  }


  get(cue, code) {
    code = code || Session.get("native") // en-GB | ru
    let phrase = this.phrases.find(phrase => (
      phrase.cue === cue
    ))[code]

    if (!phrase) {
      // Check if there is a more generic phrase without the region
      code = code.replace(/-\w+/, "") // en | ru
      phrase = this.phrases.find(phrase => (
        phrase.cue === cue
      ))[code]
    }

    if (!phrase) {
      phrase = "***" + cue * "***"
    }

    return phrase
  }


  flag(code) {
    return this.folder + this.flags[code]
  }
}


export default new Phrases()