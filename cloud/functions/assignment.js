var Assignment = Parse.Object.extend("Assignment")

Parse.Cloud.define("assignmentPush", function(req, res) {
  Parse.Cloud.useMasterKey()

  var question = new Assignment()
  var responses = {
    2: "A tutor is working on your question 😃",
    3: "A tutor has solved on your question 😃"
  }
  var data = {
    action: "questionsController.reload"
  }

  question.id = req.params.question
  question.fetch().then(function() {
    var state = question.get("state")

    if(state in responses) {
      data["sound"] = "alert.caf"
      data["alert"] =  responses[state]
    }

    var pushQuery = new Parse.Query(Parse.Installation);
    pushQuery.equalTo("user", question.get("creator"))

    return Parse.Push.send({
  	  where: pushQuery,
  	  data: data
  	})
  }).then(function() {
    res.success("Successfully send push notification")
  }, function(error) {
    res.error(error.description)
  })
})
