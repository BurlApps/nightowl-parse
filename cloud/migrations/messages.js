var User = Parse.User
var Message  = Parse.Object.extend("Message")

Parse.Cloud.define("migrationMessage", function(req, res) {
  Parse.Cloud.useMasterKey()

  var user = new User()
  var mesage = new Message()
  var random = Math.random().toString(36).slice(2)

  user.set("username", random)
  user.set("password", random)

  user.signUp().then(function() {
    mesage.set("text", "")
    mesage.set("type", 0)
    mesage.set("user", user)

    return mesage.save()
  }).then(function() {
    return mesage.destroy()
  }).then(function() {
    return user.destroy()
  }).then(function() {
    res.success("Successfully added message class")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
