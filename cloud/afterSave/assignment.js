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
      data.action = "claimed"
      Parse.Cloud.run("updateSlack", data)
      break

    case 3:
      data.action = "completed"
      Parse.Cloud.run("updateSlack", data)
      break

    case 7:
    case 8:
      data.action = "flagged"
      Parse.Cloud.run("updateSlack", data)
      break

    case 9:
      data.action = "deleted"
      Parse.Cloud.run("updateSlack", data)
      break
  }
})
