
import { Session } from 'meteor/session'

// Subscriptions
import { removeFrom } from '../../tools/utilities'
import collections from '../../api/collections'

// viewSize
import { log
       , reGroup
       } from '../../api/methods/methods'
import Storage from '../../tools/storage'



export default class StartUp {
  constructor(setViewAndSize) {
    this.setViewAndSize = setViewAndSize

    /// <<< HARD-CODED
    const timeOutDelay = 10 * 1000 // 500 ms is enough in development
    const splashDelay = 1000 // min time (ms) to show Splash screen
    /// HARD-CODED >>>

    this.ready = this.ready.bind(this)
    this.hideSplash = this.hideSplash.bind(this)
    this.groupsCallback = this.groupsCallback.bind(this)
    this.connectionTimedOut = this.connectionTimedOut.bind(this)

    // Loading takes about 250ms when running locally
    this.timeOut = setTimeout(this.connectionTimedOut, timeOutDelay)

    this.prepareSplash(splashDelay)
    // Will trigger setViewSize when all is ready
  }


  prepareSplash(splashDelay) {
    this.showSplash  = + new Date() + splashDelay
    this.unReady = []
    this.subscriptions = {}

    this.connectToMongoDB() // calls ready => setViewSize when ready
  }


  connectToMongoDB() {
    for (let collectionName in collections) {
      this.unReady.push(collectionName)

      const collection = collections[collectionName]
      // We can send (multiple) argument(s) to the server publisher
      // for debugging purposes
      const callback = () => this.ready(collectionName, "Share")
      const handle   = Meteor.subscribe(collection._name, callback)
      this.subscriptions[collectionName] = handle
    }

    // console.log("Subscriptions", this.subscriptions)
  }


  ready(collectionName) {
    removeFrom(this.unReady, collectionName)

    if (!this.unReady.length) {
      if (this.timeOut) {
        // Leave this.timeOut as a non-zero value
        clearTimeout(this.timeOut)
        this.prepareApp()
      }
    }
  }


  connectionTimedOut() {
    this.timeOut = 0 // this.prepareConnection will not run now
    this.setViewAndSize("TimeOut")
  }


  // CONNECTION SUCCESSFUL // CONNECTION // SUCCESSFUL CONNECTION //


  /** MongoDB is ready: use it to check which view to show
   *
   *  Four cases:
   *  1. New user
   *  2. Returning user
   *  3. Teacher
   *  4. Admin
   *
   *  A new user needs to go down the native, name, teacher path
   *  Returning user:
   *    • (When menu is available or if * is in path), resume
   *    • Until menu is available, review profile
   *  A teacher:
   *    • Rejoin a group that was active and which still has a student
   *    • Go to Teach if not
   *  Admin: TBD
   */
  prepareApp() {
    this.setSessionData()
    // First time user: no Session data
    // Returning user:  user_id is set
    // Teacher:         teacher_id is set

    switch (Session.get("role")) {
      case "admin":
      // TODO
      break

      case "teacher":
        this.checkForActiveGroup()
      break

      case "user":
        this.reJoinGroups()
      break

      default:
        this.go = "Profile"
        this.hideSplash()
    }
  }


  setSessionData() {
    const storedData = Storage.get()
    const keys = Object.keys(storedData)
    const teacher = this.checkURLForTeacherName()
    // TODO: Add test for admin

    if (teacher) {
      Session.set("teacher_id", teacher.id)
      Session.set("native",     teacher.language)
      Session.set("language",   teacher.language)
      Session.set("role",       "teacher")
      // d_code, q_code, q_color

    } else if (keys.length) {
      Session.set("role",       "user")

      for (let key in storedData) {
        Session.set(key, storedData[key])
      }
    } else {
      // First time user on this device
    }
  }


  checkURLForTeacherName() {
    // http://activities.jazyx.com/<teacher_id>
    // http://activities.jazyx.com/?teacher=<teacher_id>

    let id = window.location.pathname.substring(1) // /id => id
    let teacher = this.getTeacher(id)

    if (!teacher) {
      const search = window.location.search.toLowerCase()
      id = new URLSearchParams(search).get("teacher")
      if (id) {
        teacher = this.getTeacher(id)
      }
    }

    return teacher // may be undefined
  }


  getTeacher(id) {
    id = decodeURI(id)
         .replace(/^аа$/, "aa") // Russian а to Latin a for Настя
    return collections["Teachers"].findOne({ id })
  }


  /** Check if the connection just broke and if so, log back in
   *  to the shared group. Otherwise, go to the Teach view.
   */
  checkForActiveGroup() {
    // TODO: Integrate menu then remove the following 2 lines
    this.go = "Teach"
    return this.hideSplash()
  }


  reJoinGroups() {
    // TODO: Integrate menu then remove the following 4 lines
    if (!window.location.pathname.startsWith("/*") ) {
      // console.log("Returning user:", Session.get("username"))
      this.go = "Profile"
      return this.hideSplash()
    }

    const user_id = Session.get("user_id")
    const teacher_id = Session.get("teacher")
    const params = {
      user_id
    , teacher_id
    , in: true
    }
    const callback = this.groupsCallback

    // Update the User document
    log.call(params)

    // // Log in to one-on-one group with teacher
    // reGroup.call(params, callback)
  }


  groupsCallback(error, groups) {
    if (error) {
      // Unable to join existing groups. No information about which
      // group the user should be in. Go to the Activity page, with
      // the Menu open, so that the user can choose to edit their 
      // Profile/Preferences
      this.go = "Profile"
    }

    // // console.log(Session.keys)
    // language: ""en-GB""
    // native:   ""ru""
    // role:     ""user""
    // teacher:  ""jn""
    // user_id:  ""y6sQmtm5DGqE27S95""
    // username: ""Влад"
    // +
    // group_id: ""aKEisZAmCpPEq5qKC""

    // Find the first group where this user is master. For now, this
    // is the one-on-one teacher group only.
    // TODO: When multiple group membership is enabled, create a
    //       Choose Group landing page
    groups.every(group => {
      if (group.master === Session.get("user_id")) {
        Session.set("group_id", group._id)
        Session.set("isMaster", true)
        this.go = group.view
        this.hideSplash()

        return false
      }

      return true
    })
  }


  msSinceLastSeen() {
    let elapsed = 0

    const _id = Session.get("user_id")
    const user = collections["Users"].findOne({ _id })
    if (user) {
      const loggedOut = new Date(user.loggedOut)
      elapsed = + new Date() - loggedOut
    }

    console.log("elapsed:", elapsed)

    return elapsed
  }


  reconnect() {
    let view = "Profile"
    const id = Session.get("user_id")

    if (id) {
      // const elapsed = this.msSinceLastSeen()

      // if (elapsed && elapsed < this.reconnectDelay) {
        this.reJoinGroups()
      // }
    }

    return view
  }


  hideSplash() {
    if (+ new Date() < this.showSplash) {
      return setTimeout(this.hideSplash, 100)
    }

    if (!this.timeOut) {
      // connectionTimedOut was triggered, and the TimeOut screen is
      // showing.
      // TODO: Provide three buttons on the TimeOut screen:
      // * Reload
      // * Wait
      // * Continie
      // Continue will be disabled until this method is called. When
      // it becomes enabled, it will jump to the view store in Groups.
      return this.setView("TimeOut")
    }

    this.showSplash = 0

    // Tell Share to replace the Splash screen will with an
    // interactive view (Profile, Activity or an activity-in-progress)
    this.setViewAndSize(this.go)
  }
}
