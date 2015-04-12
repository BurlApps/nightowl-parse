var Assignment = Parse.Object.extend("Assignment")

Parse.Cloud.define("assignmentPush", function(req, res) {
  Parse.Cloud.useMasterKey()

  var question = new Assignment()
  var responses = {
    2: "A tutor is working on your question 😃",
    3: "A tutor has solved your question 😃"
  }

  question.id = req.params.question
  question.fetch().then(function() {
    return question.get("creator").fetch()
  }).then(function(user) {
    var state = question.get("state")

    if(user.get("phone")) {
      if(!(state in responses)) return true

      var data = {
        "To": user.get("phone"),
        "Body": responses[state]
      }

      if(state == 3) {
        data["MediaUrl"] = question.get("answer").url()
      }

      return Parse.Cloud.run("twilioMessage", data)
    } else {
      var data = {
        action: "questionsController.reload"
      }

      if(state in responses) {
        data["sound"] = "alert.caf"
        data["alert"] = responses[state]
      }

      var pushQuery = new Parse.Query(Parse.Installation);
      pushQuery.equalTo("user", user)

      return Parse.Push.send({
    	  where: pushQuery,
    	  data: data
  	  })
    }
  }).then(function() {
    res.success("Successfully send push notification")
  }, function(error) {
    res.error(error.message)
  })
})
