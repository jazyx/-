import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';

//// VIEWS // VIEWS // VIEWS // VIEWS // VIEWS // VIEWS // VIEWS ////
//
// Share is a div that wraps all content. On the device that is
// sharing its screen (master), the content will fill the screen. On
// other devices that are viewing and interacting with the master,
// the Share wrapper will ensure that the aspect ratio of the master
// screen is preserved. It maintains the `units` Session variable.
import Share from './Share.jsx';

// The Menu is an overlay which users can slide out from the left to
// choose different activities, different options within an activity
// or their profile settings. The teacher (as a privileged slave) can
// interact with the menu, but other users cannot.
import Menu from './Menu.jsx';

// "<<< TODO
// The Points view sits above Menu and the other Share'd content
// to display remote cursor and touch actions
import Points from './Points.jsx'

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
import Profile from './Profile.jsx';

// Activity shows a scrolling list of available activities, or of
// options that are accessible from inside an activity
import Activity from './activities/Activity.jsx';

// ADD NEW ACTIVITY VIEWS HERE...
import Drag from './activities/Drag.jsx';
import Mimo from './activities/Mimo.jsx';



// Disable the context menu. Everywhere.
document.body.addEventListener("contextmenu", (event) => {
  // event.preventDefault()
  return false
}, false)



export class App extends Component {
  constructor(props) {
    super(props)
    // ... AND HERE:
    this.views = {
      Profile
    , Activity
    , Drag
    , Mimo
    }

    this.share = React.createRef()
    this.state = { view: "Profile" }

    this.storePointMethod = this.storePointMethod.bind(this)
    this.setViewSize = this.setViewSize.bind(this)
    this.setView = this.setView.bind(this)
  }


  // Called by any view that is currently active, and by the Menu
  setView(view) {
    if (this.views[view]) {
      this.setState({ view })
    } else {
      console.log("Unknown view:", view)
    }
  }


  /** Called by the setViewSize method of the Share component
   *  on initialization and when the window resizes
   */
  setViewSize(aspectRatio, shareRect) {
    this.setState({ aspectRatio, shareRect })
    console.log("setViewSize — aspectRatio:", aspectRatio, "shareRect:", shareRect)
  }


  storePointMethod(pointsComponent) {
    if (pointsComponent) {
      this.pointMethod = pointsComponent.pointMethod
      this.pointMethod({ type: "message", target: "App" })
    }
  }


  render() {
    // The Share component needs to be rendered in order for
    // this.state.units to be set, so the first render will have no
    // content

    if (this.state.aspectRatio === undefined) {
      // This is cheeky. this.setSize() will be called from the Share
      // instance constructor, which is technically during this
      // render operation, and it calls this.setState(). We may need
      // to debounce it.
      return <Share setViewSize={this.setViewSize} />
    }

    const View = this.views[this.state.view]
    const aspectRatio = this.state.aspectRatio

    return <Share
      rect={this.shareRect}
      setViewSize={this.setViewSize}
    >
      <View
        setView={this.setView}
        aspectRatio={aspectRatio}
        points={this.pointMethod}
      />
    </Share>
  }
}


      // <Menu
      //   hide={this.state.view === "Profile"}
      //   setView={this.setView}
      //   aspectRatio={aspectRatio}
      // />
      // <Points
      //   ref={this.storePointMethod}
      //   rect={this.shareRect}
      // />
      // <Chat />