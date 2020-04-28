import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

//// VIEWS // VIEWS // VIEWS // VIEWS // VIEWS // VIEWS // VIEWS ////
//
// Share is a div that wraps all content. On the device that is
// sharing its screen (master), the content will fill the screen. On
// other devices that are viewing and interacting with the master,
// the Share wrapper will ensure that the aspect ratio of the master
// screen is preserved. It maintains the `units` Session variable.
//   Since it is the first view to be rendered, and since the same
// instance is used for the whole lifetime of the app, it also
// opens connections to all non-activity collections, and keeps them
// open until the user quits the app.
import Share from './Share.jsx';

// Splash is shown until all the collections are ready, or for 1 s,
// whichever is longer. TimeOut is shown if the non-activity
// collections take too long to load.
import Splash from './startup/Splash.jsx';
import TimeOut from './startup/TimeOut.jsx';

// The Menu is an overlay which users can slide out from the left to
// choose different activities, different options within an activity
// or their profile settings. The teacher (as a privileged slave) can
// interact with the menu, but other users cannot.
import Menu from './Menu.jsx';

// "<<< TODO
// The Pointers view sits above Menu and the other Share'd content
// to display remote cursor and touch actions
import Pointers from './Pointers.jsx'

// The Chat overlay will slide out from the right. When it is hidden
// incoming messages will be shown briefly in a semi-transparent layer
// over the Share'd content. Its layout is not restricted to the
// Share viewport, but it is displayed as a child of the Share
// component for HTML neatness.
import Chat from './Chat.jsx'


// Profile is basically a switch which shows one by one a series of
// screens used by first time users, and for updating your profile.
// It has its own setView method which yields to the setView method
// here when profiling is finished.
import Profile from './profile/Profile.jsx';

// Activity shows a scrolling list of available activities, or of
// options that are accessible from inside an activity
import Activity from './activities/Activity.jsx';

// ADD NEW ACTIVITY VIEWS HERE...      AND ALSO BELOW vvvv
import Drag from './activities/Drag.jsx';
import Mimo from './activities/Mimo.jsx';



export class App extends Component {
  constructor(props) {
    super(props)
    // ... AND HERE:
    this.views = {
      // Startup
      Splash
    , TimeOut
      // Generic views
    , Profile
    , Activity
      // ADD NEW ACTIVITY VIEWS HERE, AND ALSO ABOVE ^^^^
    , Drag
    , Mimo
    }

    this.state = { view: "Splash" }

    this.storePointMethod = this.storePointMethod.bind(this)
    this.setViewAndSize = this.setViewAndSize.bind(this)
    this.setViewSize = this.setViewSize.bind(this)
    this.setView = this.setView.bind(this)
  }


  /** Called by Share.setViewSize after StartUp has loaded collections
   *  and determined which view to show. We need to set all three
   *  state variables at once in order to avoid an unnecessary and
   *  disruptive re-render.
   */
  setViewAndSize(viewAndSize) {
    // console.log("App setViewAndSize(" + JSON.stringify(viewAndSize) + ")")
    // { view
    // , aspectRatio
    // , shareRect
    // }
    this.setState(viewAndSize)
  }


  /** Called by the setViewSize method of the Share component
   *  on initialization and when the window resizes
   *
   * @param  {object}  viewSize  { aspectRatio // number (≈ 0.5 - 2.0)
   *                             , shareRect   // { top, left
   *                             }             // , width, height }
   */
  setViewSize(viewSize) {
    this.setState( viewSize )

    // console.log(
    //  "setViewSize — aspectRatio:"
    // , viewSize.aspectRatio
    // , "shareRect:"
    // , viewSize.shareRect
    // )
  }


  // Called by any view that is currently active, and by the Menu
  setView(view) {
    if (this.views[view]) {
      this.setState({ view })
    } else {
      console.log("Unknown view:", view)
    }
  }


  storePointMethod(pointersComponent) {
    if (pointersComponent) {
      this.pointMethod = pointersComponent.pointMethod
      this.pointMethod(
        { type: "test message", target: "App.storePointMethod" }
      )
    }
  }


  render() {
    // The Share component needs to be rendered in order for
    // this.state.units to be set, so the first render will have no
    // content

    let view = this.state.view  // "Splash" | "Profile" | ...
    let View = this.views[view]

    if (this.state.aspectRatio === undefined) {
      // When all the collections are ready and the best landing view
      // has been determined, we need to set view, aspectRatio and
      // sharedRect all at once; we use this.setViewANDSize for that
      return <Share
        setViewSize={this.setViewAndSize} // used to hide Splash view
        tag="solo" // debugging only
      >
        <View />
      </Share>
    }

    const aspectRatio = this.state.aspectRatio

    // Menu might ask to jump directly to a basic choice view. Use
    // Profile to navigate between them.
    switch (view) {
      case "Name":
      case "Group":
      case "Teach":
      case "Native":
      case "Teacher":
      case "Language":
        View = this.views.Profile
      break
      case "Profile":
        view = "Native"
    }

    // console.log("App about to render view:", view)

    return <Share
      rect={this.shareRect}
      setViewSize={this.setViewSize} // <View /> will set the view
      tag="view" // for debugging only
    >
      <View
        view={view}
        setView={this.setView}
        aspectRatio={aspectRatio}
        points={this.pointMethod}
      />
      <Menu
        hide={this.state.view === "Profile"}
        setView={this.setView}
        aspectRatio={aspectRatio}
      />
      <Pointers
        ref={this.storePointMethod}
        rect={this.shareRect}
      />
      <Chat />
    </Share>
  }
}





// Disable the context menu. Everywhere.
document.body.addEventListener("contextmenu", (event) => {
  // event.preventDefault()
  return false
}, false)
