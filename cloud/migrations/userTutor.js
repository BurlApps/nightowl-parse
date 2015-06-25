var User = Parse.User
var Tutor  = Parse.Object.extend("Tutor")

Parse.Cloud.define("migrationUserTutor", function(req, res) {
  Parse.Cloud.useMasterKey()

  var user = new User()
  var tutor = new Tutor()
  var random = Math.random().toString(36).slice(2)

  tutor.set("question", 0)
  tutor.set("earned", 0)
  tutor.set("paid", 0)
  tutor.set("slack", "@tutor")
  tutor.set("start", 1)
  tutor.set("end", 2)
  tutor.set("enabled", true)
  tutor.set("email", false)

  tutor.save().then(function() {
    user.set("username", random)
    user.set("password", random)
    user.set("tutor", tutor)
    user.set("name", "test")
    user.set("phone", "test")
    user.set("unsubscribe", true)
    user.set("source", "sms")
    user.set("questions", 0)

    return user.signUp()
  }).then(function() {
    tutor.set("user", user)

    return tutor.save()
  }).then(function() {
    return user.destroy()
  }).then(function() {
    return tutor.destroy()
  }).then(function() {
    res.success("Successfully added tutor field")
  }, function(error) {
    res.error(error.message)
  })
})
