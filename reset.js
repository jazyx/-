db.users.update({},{$set:{loggedIn:[]}},{multi:true})
db.teachers.update({id:{$in:["jn","aa"]}},{$set:{loggedIn:[]}},{multi:true})
db.groups.update({},{$set:{loggedIn:[],active:false}},{multi:true})
