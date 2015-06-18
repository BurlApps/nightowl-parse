Parse.Cloud.define("referredUser", function(req, res) {
  Parse.Cloud.useMasterKey()

  var current = Parse.User.current()
  var user = new Parse.User()
  var credits = req.params.credits

  user.id = req.params.user
  if(current.id == user.id) return res.error("Same user!")

  user.fetch().then(function() {
    var referrals = user.relation("referrals")

    referrals.add(current)
    user.increment("freeQuestions", credits)

    return user.save()
  }).then(function() {
    var name = "Your friend"
    var pushQuery = new Parse.Query(Parse.Installation)
    pushQuery.equalTo("user", user)

    if(current.get("name")) {
      name = current.get("name")
    }
    
    var msg = name + " just joined Night Owl! Here's " + credits + " free questions!"

    return Parse.Push.send({
      where: pushQuery,
      data: {
        action: "settingsController.reload",
        actions: "settingsController.reload, user.message",
        alert: msg,
        message: msg,
        title:  "Thanks For Sharing",
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
