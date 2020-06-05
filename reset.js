db.users.update({},{
  $set:{logged_in:[],history:{}}
, $unset:{loggedIn:0}
},{multi:true})
db.teachers.update({id:{$in:["jn","aa","ml"]}},{
  $set:{logged_in:[]}
, $unset:{loggedIn:0}
 },{multi:true})
db.groups.update({},{
  $set:{logged_in:[],active:false}
, $unset:{
    loggedIn:0
  , view_size:0
  , viewSize:0
  , viewData:0
  , view_data:0
  , view:0
  , path:0
  }
},{multi:true})
