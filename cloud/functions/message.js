var Message = Parse.Object.extend("Message")

Parse.Cloud.define("messagePush", function(req, res) {
  Parse.Cloud.useMasterKey()

  var message = new Message()
  message.id = req.params.message

  message.fetch().then(function() {
    return message.get("user").fetch()
  }).then(function(user) {
    if(user.get("phone")) {
      return Parse.Cloud.run("twilioMessage", {
        "To": user.get("phone"),
        "Body": message.get("text")
      })
    } else {
      var pushQuery = new Parse.Query(Parse.Installation)
      pushQuery.equalTo("user", user)

      return Parse.Push.send({
    	  where: pushQuery,
    	  data: {
          action: "support.message",
          sound: "alert.caf",
          message: message.get("text"),
          alert: "Support: " + message.get("text")
        }
  	  })
    }
  }).then(function() {
    res.success("Successfully sent push notification")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
