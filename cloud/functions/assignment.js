var User = Parse.User
var Assignment = Parse.Object.extend("Assignment")
var Message = Parse.Object.extend("Message")
var Settings = require("cloud/utils/settings")

Parse.Cloud.define("assignmentActivate", function(req, res) {
  var query = new Parse.Query(Assignment)
  var user = new User()

  user.id = req.params.user
  user.fetch().then(function() {
    query.equalTo("state", 0)
    query.equalTo("creator", user)

    return query.each(function(question) {
      question.set("state", 1)
      return question.save()
    })
  }).then(function() {
    res.success("Successfully activated assignments")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})

Parse.Cloud.define("assignmentPush", function(req, res) {
  Parse.Cloud.useMasterKey()

  var settings
  var question = new Assignment()
  var responses = {
    2: "A tutor is working on your question 😃",
    3: "Just sent your answer!",
    7: "Your question was flagged for being unclear or blurry",
    8: "Your question was flagged for having to many parts"
  }

  question.id = req.params.question

  Settings().then(function(data) {
    settings = data
  }).then(function() {
    return question.fetch()
  }).then(function() {
    return question.get("creator").fetch()
  }).then(function(user) {
    var state = question.get("state")

    // Send to phone
    if(user.get("source") == "sms") {
      if(!(state in responses)) return true

      var data = {
        "To": user.get("phone"),
        "Body": "Bot: " + responses[state]
      }

      if(state == 3) {
        data["MediaUrl"] = question.get("answer").url()

        if(user.get("freeQuestions") > 0) {
          var price = settings.get("questionPrice")

          if(price < 1) {
            price = (price * 100) + " cents"
          } else {
            price = "$" + price
          }

          data["Body"] += [
            " You still have ",
            user.get("freeQuestions"), " free question. ",
            "After that it’s only ", price,
            " for our grad students to solve your math questions 😃"
          ].join("")
        }
      }

      return Parse.Cloud.run("twilioMessage", data)

    // Send via push notification
    } else {
      var data = {
        action: "questionsController.reload",
      }

      if(state in responses) {
        data["sound"] = "alert.caf"
        data["alert"] = responses[state]
        data["badge"] = "Increment"
      }

      var pushQuery = new Parse.Query(Parse.Installation)
      pushQuery.equalTo("user", user)

      return Parse.Push.send({
    	  where: pushQuery,
    	  data: data
  	  })
    }
  }).then(function() {
    res.success("Successfully sent push notification")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
