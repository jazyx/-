// User.create({
//       native:   Session.get("native")
//     , username: Session.get("username")
//     , language: profile.language)
//     , teacher:  this.state.selected)
//     })

let counter = 0


class User {
  constructor() {

  }

  create(userData) {
    console.log(counter++, userData)
  }

}



export default new User()