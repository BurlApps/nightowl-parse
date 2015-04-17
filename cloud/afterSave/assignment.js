var Settings = require("cloud/utils/settings")
var Mailgun = require('mailgun')

Parse.Cloud.afterSave("Assignment", function(req, res) {
  var question = req.object
  var data = {
    question: question.id
  }

  Parse.Cloud.run("assignmentPush", data)

  switch(question.get("state")) {
    case 1:
      Parse.Cloud.run("notifyTutors")
      Parse.Cloud.run("notifySlack")
      break

    case 2:
      Parse.Cloud.run("claimedSlack", data)
      break
  }
})
