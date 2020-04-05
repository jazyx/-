import React, { Component } from 'react';
// import { withTracker } from 'meteor/react-meteor-data';
 
// import { L10n } from '../api/l10n.js';
import Native  from './connect/Native.jsx';


export default class Connect extends Component {
  render() {
    return <div>
      <Native />
      <button
        onMouseUp={() => this.props.setView("Game")}
      >
        Start Game
      </button>
    </div>
  }
}


// export default withTracker(() => {
//   return {
//     l10n: L10n.find({}).fetch(),
//   };
// })(Connect);