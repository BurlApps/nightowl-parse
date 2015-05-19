Parse.Cloud.define("referredUser", function(req, res) {
  Parse.Cloud.userMasterKey()
  var current = Parse.User.current()
  var user = new Parse.User()
  var credits = parseInt(req.params.credits)
  user.id = req.params.user
  
  if(current.id == user.id) return res.error("Same user!")
  
  user.increment("freeQuestions", credits)
  
  var data = {
    action: "settingsController.reload",
    alert: "Your friend joined Night Owl! Here's " + credits + " free questions!"
  }
  
  var pushQuery = new Parse.Query(Parse.Installation)
  pushQuery.equalTo("user", user)

  return user.save().then(function() {
    return Parse.Push.send({
      where: pushQuery,
      data: data
    })
  }).then(function() {
    res.success("Successfully sent push notification")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})