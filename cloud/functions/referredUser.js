Parse.Cloud.define("referredUser", function(req, res) {
  Parse.Cloud.useMasterKey()

  var current = Parse.User.current()
  var user = new Parse.User()
  var credits = req.params.credits

  user.id = req.params.user
  if(current.id == user.id) return res.error("Same user!")

  user.increment("freeQuestions", credits)

  return user.save().then(function() {
    var pushQuery = new Parse.Query(Parse.Installation)
    pushQuery.equalTo("user", user)

    return Parse.Push.send({
      where: pushQuery,
      data: {
        action: "settingsController.reload",
        alert: "Your friend just joined Night Owl! Here's " + credits + " free questions!",
        sound: "alert.caf"
      }
    })
  }).then(function() {
    res.success("Successfully sent push notification")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
